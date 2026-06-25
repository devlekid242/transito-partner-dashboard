import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../../components/form/form.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recuperation-de-compte',
  templateUrl: './recuperation-de-compte.page.html',
  styleUrls: ['./recuperation-de-compte.page.css'],
  imports: [FormComponent, NotificationComponent, CommonModule],
})
export class RecuperationDeComptePage {
  isLoading: boolean = false;
  isSent: boolean = false;

  // Form fields for password recovery
  recoveryFormFields: FormField[] = [
    {
      key: 'email',
      label: 'Adresse E-mail',
      type: 'email',
      required: true,
      placeholder: 'nom@entreprise.com',
    },
  ];

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  // Gestion de la soumission du formulaire
  onSubmit(formData: any): void {
    this.isLoading = true;

    // Simulation de l'envoi (1.5 seconde)
    setTimeout(() => {
      this.isLoading = false;
      this.isSent = true;
      this.showToastNotification('success', 'Lien de récupération envoyé avec succès!');

      // Réinitialisation de l'état du bouton après 3 secondes
      setTimeout(() => {
        this.isSent = false;
      }, 3000);
    }, 1500);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }
}
