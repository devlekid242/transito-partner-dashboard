import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajout-trajet',
  templateUrl: './ajout-trajet.page.html',
  styleUrls: ['./ajout-trajet.page.css'],
  imports: [CommonModule],
})
export class AjoutTrajetPage {
  // Form fields for trip creation
  tripFormFields: FormField[] = [
    {
      key: 'departureCity',
      label: 'Ville de Départ',
      type: 'text',
      required: true,
      placeholder: 'Ex: Douala',
    },
    {
      key: 'arrivalCity',
      label: "Ville d'Arrivée",
      type: 'text',
      required: true,
      placeholder: 'Ex: Yaoundé',
    },
    {
      key: 'departureDate',
      label: 'Date de Départ',
      type: 'text',
      required: true,
      placeholder: 'YYYY-MM-DD',
    },
    {
      key: 'departureTime',
      label: 'Heure de Départ',
      type: 'text',
      required: true,
      placeholder: 'HH:MM',
    },
    {
      key: 'assignedBus',
      label: 'Bus Assigné',
      type: 'select',
      required: true,
      options: [
        { value: 'TR-842-X', label: 'VIP - Mercedes Travego (LT 1234 A)' },
        { value: 'TR-119-Y', label: 'Standard - Toyota Coaster (CE 5678 B)' },
        { value: 'TR-505-Z', label: 'Classic - Yutong ZK6122 (OU 9012 C)' },
      ],
    },
    {
      key: 'ticketPrice',
      label: 'Prix du Billet (XAF)',
      type: 'number',
      required: true,
      placeholder: 'Ex: 5000',
      min: 0,
      step: 100,
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
    console.log('Trip form submitted:', formData);
    this.showToastNotification('success', 'Trajet créé avec succès!');

    // Show confirmation modal
    this.modalTitle = 'Trajet Créé';
    this.modalMessage = `Le trajet ${formData.departureCity} → ${formData.arrivalCity} a été créé avec succès.`;
    this.isModalOpen = true;
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
}
