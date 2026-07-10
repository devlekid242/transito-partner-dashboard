import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { Component, signal, computed, effect } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-demande-de-retrait',
  templateUrl: './demande-de-retrait.page.html',
  styleUrls: ['./demande-de-retrait.page.css'],
  imports: [CommonModule, FormComponent, ModalComponent, NotificationComponent],
})
export class DemandeDeRetraitPage {
  // Modal state
  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly isWithdrawalModalOpenSignal = signal<boolean>(false);
  isWithdrawalModalOpen = computed(() => this.isWithdrawalModalOpenSignal());

  // Balance data
  private readonly balanceSignal = signal({
    available: '0 XAF',
    pending: '0 XAF',
    pendingTransactions: 0,
  });
  balance = computed(() => this.balanceSignal());

  private readonly availableAmountSignal = signal<number>(0);
  availableAmount = computed(() => this.availableAmountSignal());

  // Recent transactions
  private readonly recentTransactionsSignal = signal<any[]>([]);
  recentTransactions = computed(() => this.recentTransactionsSignal());

  // Form fields
  private readonly withdrawalFormFieldsSignal = signal<FormField[]>([
    {
      key: 'amount',
      label: 'Montant à retirer (XAF)',
      type: 'number',
      required: true,
      placeholder: 'Ex: 500000',
      min: 0,
      step: 100,
    },
    {
      key: 'paymentMethod',
      label: 'Méthode de paiement',
      type: 'select',
      required: true,
      options: [],
    },
    {
      key: 'notes',
      label: 'Notes (optionnel)',
      type: 'textarea',
      required: false,
      placeholder: 'Informations sur le compte / instructions',
    },
  ]);
  withdrawalFormFields = computed(() => this.withdrawalFormFieldsSignal());

  // Notification state
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  // Submission state
  private readonly isSubmittingSignal = signal<boolean>(false);
  isSubmitting = computed(() => this.isSubmittingSignal());

  // Range selection
  private readonly selectedWithdrawalRangeSignal = signal<string>('this_year');
  selectedWithdrawalRange = computed(() => this.selectedWithdrawalRangeSignal());

  withdrawalRangeOptions = [
    { value: 'this_year', label: 'Cette année' },
    { value: 'last_year', label: 'Année dernière' },
  ];

  constructor(
    private partnerApiService: PartnerApiService,
    private alertService: AlertService,
  ) {
    this.loadPartnerStats();

    this.partnerApiService.getPaymentMethods().subscribe((options) => {
      const fields = this.withdrawalFormFieldsSignal();
      const idx = fields.findIndex((f) => f.key === 'paymentMethod');
      if (idx !== -1) {
        fields[idx].options = options;
        this.withdrawalFormFieldsSignal.set([...fields]);
      }
    });
  }

  selectWithdrawalRange(value: string | null): void {
    if (!value) {
      return;
    }
    this.selectedWithdrawalRangeSignal.set(value);
  }

  // Ouvrir la modale
  openModal(): void {
    this.isModalOpenSignal.set(true);
  }

  // Fermer la modale
  closeModal(): void {
    this.isModalOpenSignal.set(false);
    this.isWithdrawalModalOpenSignal.set(false);
  }

  // Ouvrir la modale de retrait
  openWithdrawalModal(): void {
    this.isWithdrawalModalOpenSignal.set(true);
  }

  // Fermer la modale de retrait
  closeWithdrawalModal(): void {
    this.isWithdrawalModalOpenSignal.set(false);
  }

  // Traitement de la soumission du formulaire
  onFormSubmit(formData: any): void {
    if (this.isSubmittingSignal()) {
      return;
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      this.alertService.error('Montant invalide.');
      return;
    }
    if (amount > this.availableAmountSignal()) {
      this.alertService.error('Montant supérieur au solde disponible.');
      return;
    }

    this.isSubmittingSignal.set(true);
    this.partnerApiService.createWithdrawal(formData).subscribe({
      next: (res) => {
        this.isSubmittingSignal.set(false);
        this.alertService.success('Demande de retrait soumise avec succès!');
        this.closeWithdrawalModal();
        this.openModal();
        if (res?.available !== undefined) {
          const available = Number(res.available);
          this.availableAmountSignal.set(available);
          this.balanceSignal.set({
            ...this.balanceSignal(),
            available: `${available.toLocaleString('fr-FR')} XAF`,
          });
          
        } else {
          this.loadPartnerStats();
        }
      },
      error: (error) => {
        this.isSubmittingSignal.set(false);
        console.error('Withdrawal request failed:', error);
        const msg = error?.error?.message || 'Erreur lors de l’envoi de la demande de retrait.';
        this.alertService.error(msg);
      },
    });
  }

  private loadPartnerStats(): void {
    this.partnerApiService.getPartnerStats().subscribe({
      next: (stats: any) => {
        if (stats) {
          const avail = Number(stats.balance?.available ?? 0);
          this.availableAmountSignal.set(isNaN(avail) ? 0 : avail);
          const bal = this.balanceSignal();
          bal.available = `${(isNaN(avail) ? 0 : avail).toLocaleString('fr-FR')} XAF`;
          const pend = Number(stats.balance?.pending ?? 0);
          bal.pending = `${(isNaN(pend) ? 0 : pend).toLocaleString('fr-FR')} XAF`;
          bal.pendingTransactions = stats.balance?.pendingTransactions ?? bal.pendingTransactions;
          this.balanceSignal.set(bal);
          if (Array.isArray(stats.recentTransactions) && stats.recentTransactions.length) {
            this.recentTransactionsSignal.set(stats.recentTransactions);
          }
        }
      },
    });
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 5000);
  }
}
