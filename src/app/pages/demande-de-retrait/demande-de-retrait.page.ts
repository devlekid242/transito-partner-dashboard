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
  templateUrl:'./demande-de-retrait.page.html',
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
  readonly recentTransactions = signal<any[]>([]);
  
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

  transactionCols: ColumnDef[] = [
    { key: 'description', label: 'Description', sortable: true },
    { key: 'amount', label: 'Montant (+ crédit / - débit)', type: 'currency', signed: true, sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
    { key: 'createdAt', label: 'Date', type: 'date', sortable: true },
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
        this.recentTransactions.set(
          Array.isArray(stats?.recentTransactions) ? stats.recentTransactions : [],
        );
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
      next: (methods: any[]) => {

        this.paymentMethods.set(methods.map((m) => ({ value: m.id, label: m.name })));
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

  blockedBalance = computed(() => this.formatAmount(this.partnerStats()?.balance?.blocked));

  pendingBalance = computed(() => this.formatAmount(this.partnerStats()?.balance?.pending));

  totalEarned = computed(() => this.formatAmount(this.partnerStats()?.balance?.totalEarned));

  private formatAmount(value: unknown): string {
    const amount = Number(value ?? 0);
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }

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
