import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajout-bus',
  templateUrl: './ajout-bus.page.html',
  styleUrls: ['./ajout-bus.page.css'],
  imports: [CommonModule],
})
export class AjoutBusPage {
  // Form fields for bus creation
  busFormFields: FormField[] = [
    {
      key: 'plate',
      label: "Plaque d'immatriculation",
      type: 'text',
      required: true,
      placeholder: 'ex: AB-123-CD',
    },
    {
      key: 'model',
      label: 'Modèle & Marque',
      type: 'text',
      required: true,
      placeholder: 'ex: Mercedes-Benz Tourismo',
    },
    {
      key: 'capacity',
      label: 'Capacité (Sièges)',
      type: 'number',
      required: true,
      placeholder: '50',
      min: 1,
      max: 100,
    },
    {
      key: 'type',
      label: 'Type de Bus',
      type: 'select',
      required: true,
      options: [
        { value: 'vip', label: 'VIP (Wi-Fi, Climatisation)' },
        { value: 'standard', label: 'Standard' },
        { value: 'economy', label: 'Économique' },
        { value: 'minibus', label: 'Minibus' },
      ],
    },
  ];

  // Status state
  isActive = true;

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
    console.log('Bus form submitted:', formData);
    this.showToastNotification('success', 'Bus ajouté à la flotte avec succès!');

    // Show confirmation modal
    this.modalTitle = 'Bus Ajouté';
    this.modalMessage = `Le bus ${formData.model} (${formData.plate}) a été ajouté à la flotte.`;
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
