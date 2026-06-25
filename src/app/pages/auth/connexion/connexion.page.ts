import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../../components/form/form.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.page.html',
  styleUrls: ['./connexion.page.css'],
  imports: [FormComponent, NotificationComponent, CommonModule],
})
export class ConnexionPage {
  // Form fields for login
  loginFormFields: FormField[] = [
    {
      key: 'email',
      label: 'Adresse Email',
      type: 'email',
      required: true,
      placeholder: 'gestionnaire@flotte.com',
    },
    {
      key: 'password',
      label: 'Mot de passe',
      type: 'password',
      required: true,
      placeholder: '••••••••',
    },
  ];

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'error';
  notificationMessage = '';

  constructor() {}

  onFormSubmit(formData: any): void {
    console.log('Login form submitted:', formData);

    // Simulate login logic
    if (formData.email === 'admin@transito.com' && formData.password === 'password') {
      // Successful login
      this.showToastNotification('success', 'Connexion réussie! Redirection en cours...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      // Failed login
      this.showToastNotification('error', 'Email ou mot de passe incorrect');
    }
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
