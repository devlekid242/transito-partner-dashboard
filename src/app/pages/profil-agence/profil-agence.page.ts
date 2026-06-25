import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profil-agence',
  templateUrl: './profil-agence.page.html',
  styleUrls: ['./profil-agence.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class ProfilAgencePage {
  // Form fields for agency profile
  profileFormFields: FormField[] = [
    {
      key: 'agencyName',
      label: "Nom de l'Agence",
      type: 'text',
      required: true,
      placeholder: 'Nom de votre agence',
    },
    {
      key: 'registrationNumber',
      label: "Numéro d'Enregistrement",
      type: 'text',
      required: true,
      placeholder: 'RC-DLA-2021-B-XXXX',
    },
    {
      key: 'description',
      label: 'Description courte',
      type: 'textarea',
      required: false,
      placeholder: 'Description de votre agence',
      rows: 3,
    },
    {
      key: 'email',
      label: 'Email Principal',
      type: 'email',
      required: true,
      placeholder: 'direction@agence.com',
    },
    {
      key: 'phone',
      label: 'Téléphone Support',
      type: 'tel',
      required: true,
      placeholder: '+237 6XX XXX XXX',
    },
    {
      key: 'address',
      label: 'Adresse Siège Social',
      type: 'text',
      required: true,
      placeholder: 'Adresse complète',
    },
  ];

  // Documents data
  documents = [
    {
      id: 1,
      name: "Licence d'Exploitation",
      type: 'license',
      expiry: '12 Nov 2025',
      status: 'Validé',
      icon: 'description',
    },
    {
      id: 2,
      name: 'Assurance Flotte RC',
      type: 'insurance',
      expiry: '28 Fév 2024',
      status: 'Renouvellement proche',
      icon: 'security',
    },
    {
      id: 3,
      name: 'RIB Bancaire Principal',
      type: 'bank',
      expiry: 'Non applicable',
      status: 'Optionnel',
      icon: 'account_balance',
    },
  ];

  // Modal state
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  onFormSubmit(formData: any): void {
    console.log('Profile form submitted:', formData);
    this.showToastNotification('success', 'Profil mis à jour avec succès!');

    // Show confirmation modal
    this.modalTitle = 'Profil Mis à Jour';
    this.modalMessage = 'Les informations de votre agence ont été mises à jour avec succès.';
    this.isModalOpen = true;
  }

  uploadDocument(document: any): void {
    console.log('Upload document:', document.name);
    this.showToastNotification('info', `Téléversement du document ${document.name} en cours...`);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // Agency stats
  agencyStats = {
    activeSalesPoints: 12,
    nationalCoverage: '4 régions',
  };
}
