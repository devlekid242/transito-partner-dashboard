import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { SelectOption, Retrait, ColumnDef, ActionDef } from '../../models';

@Component({
  selector: 'app-demande-de-retrait',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IconComponent,
    StatCardComponent,
    DatatableComponent,
    PageHeaderComponent,
    ModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header title="Demandes de retrait" subtitle="Suivez vos demandes de versement" icon="wallet">
        <button class="btn btn-primary" (click)="openWithdrawalModal()">
          <app-icon name="plus" [size]="16" /> Demander un retrait
        </button>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des données...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <app-stat-card label="Solde disponible" [value]="availableBalance()" icon="banknote" iconBg="bg-brand-50 text-brand-600" />
          <app-stat-card label="En attente" [value]="pendingAmount()" icon="clock" iconBg="bg-amber-50 text-amber-600" />
          <app-stat-card label="Total versé" [value]="totalPaid()" icon="check-circle" iconBg="bg-primary-50 text-primary-600" />
        </div>

        <app-datatable
          [columns]="cols"
          [data]="api.retraits()"
          [exportable]="true"
          [selectable]="true"
          [rowActions]="actions"
        />
      }
    </div>

    @if (isWithdrawalModalOpen()) {
      <app-modal
        title="Demander un retrait"
        [isOpen]="isWithdrawalModalOpen()"
        (close)="closeWithdrawalModal()"
        size="medium"
      >
        <div class="p-1">
          @if (isSubmitting()) {
            <div class="flex items-center justify-center p-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <span class="ml-3">Traitement de la demande...</span>
            </div>
          } @else {
            <form [formGroup]="withdrawalForm" (ngSubmit)="submitWithdrawal()" class="space-y-5">
              <div class="space-y-4">
                <div>
                  <label class="label" for="amount">Montant à retirer (FCFA)</label>
                  <input
                    id="amount"
                    type="number"
                    class="input"
                    placeholder="Ex: 500000"
                    formControlName="amount"
                    min="1"
                    step="100"
                    required
                  />
                  @if (withdrawalForm.get('amount')?.invalid && withdrawalForm.get('amount')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Montant est requis et doit être positif</p>
                  }
                </div>
                <div>
                  <label class="label" for="paymentMethod">Méthode de paiement</label>
                  <select id="paymentMethod" class="input cursor-pointer" formControlName="paymentMethod" required>
                    <option value="">Sélectionnez une méthode</option>
                    @for (method of paymentMethods(); track method.value) {
                      <option [value]="method.value">{{ method.label }}</option>
                    }
                  </select>
                  @if (withdrawalForm.get('paymentMethod')?.invalid && withdrawalForm.get('paymentMethod')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Méthode de paiement est requise</p>
                  }
                </div>
                <div>
                  <label class="label" for="notes">Notes (optionnel)</label>
                  <textarea
                    id="notes"
                    class="input"
                    placeholder="Informations sur le compte / instructions"
                    formControlName="notes"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div class="flex justify-end gap-3 border-t border-ink-100 pt-5 mt-6">
                <button type="button" class="btn btn-secondary" (click)="closeWithdrawalModal()" [disabled]="isSubmitting()">
                  Annuler
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="withdrawalForm.invalid || isSubmitting()">
                  @if (isSubmitting()) {
                    <span class="animate-pulse">Envoi...</span>
                  } @else {
                    Soumettre la demande
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </app-modal>
    }

    @if (isCancelConfirmModalOpen()) {
      <app-modal
        title="Confirmer l'annulation"
        [isOpen]="isCancelConfirmModalOpen()"
        (close)="closeCancelConfirmModal()"
        size="small"
      >
        <div class="p-1">
          <p>Êtes-vous sûr de vouloir annuler cette demande de retrait ? Cette action est irréversible.</p>
          <div class="flex justify-end gap-3 border-t border-ink-100 pt-5 mt-6">
            <button type="button" class="btn btn-secondary" (click)="closeCancelConfirmModal()">
              Non, garder la demande
            </button>
            <button type="button" class="btn btn-danger" (click)="confirmCancelWithdrawal()" [disabled]="isProcessing()">
              @if (isProcessing()) {
                <span class="animate-pulse">Traitement...</span>
              } @else {
                Oui, annuler
              }
            </button>
          </div>
        </div>
      </app-modal>
    }
  `,
})
export class DemandeDeRetraitPage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);
  readonly isWithdrawalModalOpen = signal<boolean>(false);
  readonly isCancelConfirmModalOpen = signal<boolean>(false);
  
  // Data
  readonly partnerStats = signal<any>(null);
  readonly paymentMethods = signal<SelectOption[]>([]);
  
  // Form
  withdrawalForm: FormGroup;
  
  // Selected withdrawal for cancellation
  selectedWithdrawalId: string | null = null;

  // Table configuration
  cols: ColumnDef[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'montant', label: 'Montant', type: 'currency', sortable: true },
    { key: 'demandeur', label: 'Demandeur', sortable: true },
    { key: 'dateDemande', label: 'Date', type: 'date', sortable: true },
    { key: 'statut', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    {
      label: 'Voir',
      icon: 'eye',
      action: (r: Retrait) => this.viewWithdrawal(r),
    },
    {
      label: 'Annuler',
      icon: 'x',
      class: 'danger',
      action: (r: Retrait) => this.openCancelConfirm(r),
      condition: (r: Retrait) => r.statut === 'en_attente' || r.statut === 'pending',
    },
  ];

  constructor() {
    this.withdrawalForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMethod: ['', [Validators.required]],
      notes: ['', []],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Load partner stats (balance)
    this.api.getPartnerStats().subscribe({
      next: (stats) => {
        this.partnerStats.set(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading partner stats:', err);
        this.toast.danger('Impossible de charger le solde');
        this.isLoading.set(false);
      },
    });

    // Load payment methods
    this.api.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods.set(methods);
      },
      error: (err) => {
        console.error('Error loading payment methods:', err);
        this.toast.danger('Impossible de charger les méthodes de paiement');
      },
    });
  }

  // Computed values
  availableBalance = computed(() => {
    const stats = this.partnerStats();
    if (!stats?.balance) return '0 FCFA';
    const available = Number(stats.balance?.available ?? 0);
    return `${available.toLocaleString('fr-FR')} FCFA`;
  });

  pendingAmount = computed(() => {
    const withdrawals = this.api.retraits();
    const pending = withdrawals.filter(
      (r) => r.statut === 'en_attente' || r.statut === 'pending' || r.status === 'pending'
    );
    const total = pending.reduce((a, r) => a + (r.montant || 0), 0);
    return `${total.toLocaleString('fr-FR')} FCFA`;
  });

  totalPaid = computed(() => {
    const withdrawals = this.api.retraits();
    const paid = withdrawals.filter(
      (r) => r.statut === 'paye' || r.statut === 'paid' || r.statut === 'completee'
    );
    const total = paid.reduce((a, r) => a + (r.montant || 0), 0);
    return `${total.toLocaleString('fr-FR')} FCFA`;
  });

  // Modal methods
  openWithdrawalModal(): void {
    this.isWithdrawalModalOpen.set(true);
  }

  closeWithdrawalModal(): void {
    this.isWithdrawalModalOpen.set(false);
    this.withdrawalForm.reset();
  }

  openCancelConfirm(withdrawal: Retrait): void {
    this.selectedWithdrawalId = String(withdrawal.id);
    this.isCancelConfirmModalOpen.set(true);
  }

  closeCancelConfirmModal(): void {
    this.isCancelConfirmModalOpen.set(false);
    this.selectedWithdrawalId = null;
  }

  // Actions
  viewWithdrawal(withdrawal: Retrait): void {
    this.toast.info(`Référence: ${withdrawal.reference}\nMontant: ${withdrawal.montant} FCFA\nDate: ${withdrawal.dateDemande}`);
  }

  confirmCancelWithdrawal(): void {
    if (!this.selectedWithdrawalId) return;
    
    this.isProcessing.set(true);
    this.api.cancelWithdrawal(this.selectedWithdrawalId).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.toast.success('Demande de retrait annulée avec succès');
        this.closeCancelConfirmModal();
        this.selectedWithdrawalId = null;
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Error cancelling withdrawal:', err);
        this.toast.danger('Impossible d\'annuler la demande de retrait');
      },
    });
  }

  submitWithdrawal(): void {
    if (this.withdrawalForm.invalid) {
      this.withdrawalForm.markAllAsTouched();
      this.toast.danger('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.withdrawalForm.value;
    const amount = Number(formValue.amount);
    const available = Number((this.partnerStats()?.balance?.available ?? 0));

    if (amount > available) {
      this.toast.danger(`Montant supérieur au solde disponible (${available.toLocaleString('fr-FR')} FCFA)`);
      return;
    }

    this.isSubmitting.set(true);
    
    this.api.createWithdrawal({
      amount,
      paymentMethod: formValue.paymentMethod,
      notes: formValue.notes || undefined,
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success('Demande de retrait soumise avec succès!');
        this.closeWithdrawalModal();
        
        // Refresh balance if available in response
        if (res?.balance?.available !== undefined) {
          const stats = this.partnerStats();
          if (stats) {
            stats.balance.available = res.balance.available;
            this.partnerStats.set({ ...stats });
          }
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error creating withdrawal:', err);
        const msg = err?.error?.message || 'Erreur lors de l\'envoi de la demande de retrait';
        this.toast.danger(msg);
      },
    });
  }

  request(): void {
    this.openWithdrawalModal();
  }
}
