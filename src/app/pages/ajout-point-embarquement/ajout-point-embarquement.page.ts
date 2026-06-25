import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajout-point-embarquement',
  templateUrl: './ajout-point-embarquement.page.html',
  styleUrls: ['./ajout-point-embarquement.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule]
})
export class AjoutPointEmbarquementPage {
  // Form fields for sales point creation
  salesPointFormFields: FormField[] = [
    {
      key: 'name',
      label: 'Nom du Point de Vente',
      type: 'text',
      required: true,
      placeholder: 'Ex: Agence Centrale Douala'
    },
    {
      key: 'address',
      label: 'Emplacement / Adresse',
      type: 'text',
      required: true,
      placeholder: 'Adresse complète ou repère'
    },
    {
      key: 'phone',
      label: 'Téléphone de Contact',
      type: 'tel',
      required: true,
      placeholder: '+237 XXXXXXXX'
    },
    {
      key: 'manager',
      label: 'Gestionnaire Assigné',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Jean Dupont' },
        { value: '2', label: 'Marie Curie' },
        { value: '3', label: 'Paul Atreides' }
      ]
    },
    {
      key: 'type',
      label: 'Type de Point',
      type: 'select',
      required: true,
      options: [
        { value: 'principal', label: 'Agence Principale' },
        { value: 'premium', label: 'Kiosque Premium' },
        { value: 'express', label: 'Guichet Express' },
        { value: 'crossborder', label: 'Agence Transfrontalière' }
      ]
    }
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
    console.log('Sales point form submitted:', formData);
    this.showToastNotification('success', 'Point de vente ajouté avec succès!');

    // Show confirmation modal
    this.modalTitle = 'Point de Vente Ajouté';
    this.modalMessage = `Le point de vente ${formData.name} a été ajouté avec succès.`;
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