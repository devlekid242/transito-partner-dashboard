import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compte-utilisateur',
  templateUrl: './compte-utilisateur.page.html',
  styleUrls: ['./compte-utilisateur.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class CompteUtilisateurPage {
  // Active tab
  activeTab: 'profile' | 'security' | 'notifications' | 'preferences' = 'profile';

  // Profile form fields
  profileFormFields: FormField[] = [
    {
      key: 'fullName',
      label: 'Nom Complet',
      type: 'text',
      required: true,
      placeholder: 'Votre nom complet',
    },
    {
      key: 'email',
      label: 'Adresse Email',
      type: 'email',
      required: true,
      placeholder: 'votre@email.com',
    },
    {
      key: 'phone',
      label: 'Numéro de Téléphone',
      type: 'tel',
      required: false,
      placeholder: '+33 6 XX XX XX XX',
    },
  ];

  // Security form fields
  securityFormFields: FormField[] = [
    {
      key: 'currentPassword',
      label: 'Mot de passe actuel',
      type: 'password',
      required: true,
      placeholder: '••••••••',
    },
    {
      key: 'newPassword',
      label: 'Nouveau mot de passe',
      type: 'password',
      required: true,
      placeholder: '••••••••',
    },
    {
      key: 'confirmPassword',
      label: 'Confirmer le nouveau mot de passe',
      type: 'password',
      required: true,
      placeholder: '••••••••',
    },
  ];

  // Preferences form fields
  preferencesFormFields: FormField[] = [
    {
      key: 'language',
      label: 'Langue',
      type: 'select',
      required: true,
      options: [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
      ],
    },
    {
      key: 'theme',
      label: 'Thème',
      type: 'select',
      required: true,
      options: [
        { value: 'light', label: 'Clair' },
        { value: 'dark', label: 'Sombre' },
      ],
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

  setActiveTab(tab: 'profile' | 'security' | 'notifications' | 'preferences'): void {
    this.activeTab = tab;
  }

  onProfileSubmit(formData: any): void {
    console.log('Profile form submitted:', formData);
    this.showToastNotification('success', 'Profil mis à jour avec succès!');
  }

  onSecuritySubmit(formData: any): void {
    console.log('Security form submitted:', formData);
    this.showToastNotification('success', 'Mot de passe mis à jour avec succès!');

    // Show confirmation modal
    this.modalTitle = 'Mot de Passe Mis à Jour';
    this.modalMessage = 'Votre mot de passe a été changé avec succès.';
    this.isModalOpen = true;
  }

  onPreferencesSubmit(formData: any): void {
    console.log('Preferences form submitted:', formData);
    this.showToastNotification('success', 'Préférences mises à jour avec succès!');
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

  // User data
  user = {
    name: 'Jean Dupont',
    email: 'jean.dupont@transito.com',
    phone: '+33 6 12 34 56 78',
    role: 'Administrateur Flotte',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRjnWdkK_FFmLyclp5df4cCZcI2YiUi65U5vXkI-2wo39nQI-zz5uWwvZLdYdXkuWX5CavfQz98UA8kGMRG4CKjk4Yk-VFp24SsH8-UWD4_TIit9m3DePDj5YPJr5kb8OTRzwM0-x2VsRtlx3nJVbYAbHBFGLMbMOnId74L1VfLX9oADarYAAL3ELE-Tzyy8Cbd8dnU7QylWwNRcIO6HewatggDGNpbddLXCm3cd-DsAnXr7Z63c4RKK7Bt0CkPyEbMymPao6MMW8',
  };
}
