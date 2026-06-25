import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';

@Component({
  selector: 'app-demande-de-retrait',
  templateUrl: './demande-de-retrait.page.html',
  styleUrls: ['./demande-de-retrait.page.css'],
  imports: [CommonModule, FormComponent, ModalComponent, NotificationComponent],
})
export class DemandeDeRetraitPage {
  // Gestion de l'état de visibilité de la modale
  isModalOpen: boolean = false;

  // Form fields for withdrawal request
  withdrawalFormFields: FormField[] = [
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
      options: [
        { value: '', label: 'Sélectionnez une méthode', disabled: true },
        { value: 'bank', label: 'Virement Bancaire (UBA - **** 1234)' },
        { value: 'momo', label: 'Mobile Money (Orange - 69X XXX XXX)' },
        { value: 'momo_mtn', label: 'Mobile Money (MTN - 67X XXX XXX)' },
      ],
    },
  ];

  // Modal state
  isWithdrawalModalOpen = false;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  // Ouvrir la modale
  openModal(): void {
    this.isModalOpen = true;
  }

  // Fermer la modale
  closeModal(): void {
    this.isModalOpen = false;
    this.isWithdrawalModalOpen = false;
  }

  // Ouvrir la modale de retrait
  openWithdrawalModal(): void {
    this.isWithdrawalModalOpen = true;
  }

  // Fermer la modale de retrait
  closeWithdrawalModal(): void {
    this.isWithdrawalModalOpen = false;
  }

  // Traitement de la soumission du formulaire
  onFormSubmit(formData: any): void {
    console.log('Withdrawal request submitted:', formData);
    this.closeWithdrawalModal();
    this.showToastNotification('success', 'Demande de retrait soumise avec succès!');

    // Show confirmation modal
    this.openModal();
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  // Balance data
  balance = {
    available: '12,450,000 XAF',
    pending: '850,000 XAF',
    pendingTransactions: 2,
  };

  // Recent transactions
  recentTransactions = [
    {
      date: '2023-10-27 14:30',
      description: 'Revenus Flotte Semaine 41',
      status: 'Complété',
      amount: '+ 2,450,000 XAF',
    },
    {
      date: '2023-10-26 09:15',
      description: 'Retrait Bancaire (UBA)',
      status: 'En cours',
      amount: '- 500,000 XAF',
    },
    {
      date: '2023-10-25 16:45',
      description: 'Frais de Plateforme',
      status: 'Complété',
      amount: '- 122,500 XAF',
    },
    {
      date: '2023-10-24 11:20',
      description: 'Revenus Flotte Semaine 40',
      status: 'Complété',
      amount: '+ 2,100,000 XAF',
    },
  ];
}
