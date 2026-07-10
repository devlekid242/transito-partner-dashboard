import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormComponent, FormField } from '../../../components/form/form.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { AuthService } from '../../../services/auth.service';
import { PartnerApiService } from '../../../services/partner-api.service';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.page.html',
  styleUrls: ['./connexion.page.css'],
  standalone: true,
  imports: [FormComponent, NotificationComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimisation des cycles de détection
})
export class ConnexionPage {
  // Remplacement du constructeur par la fonction inject()
  private authService = inject(AuthService);
  private router = inject(Router);
  private partnerApiService = inject(PartnerApiService);
  private alertService = inject(AlertService);

  // Les champs du formulaire restent en lecture seule (pas besoin de signal car statiques)
  readonly loginFormFields: FormField[] = [
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

  // Déclaration des états sous forme de Signals
  readonly isSubmitting = signal<boolean>(false);
  readonly showNotification = signal<boolean>(false);
  readonly notificationType = signal<'success' | 'error' | 'warning' | 'info'>('error');
  readonly notificationMessage = signal<string>('');
  
  // Initialisation directe du signal pour l'image héro
  readonly heroImage = signal<string>(
    this.normalizeImageUrl(`${environment.baseApiUrl}/assets/hero-login.jpg`)
  );

  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseApiUrl}${normalizedPath}`;
  }

  async onFormSubmit(formData: any): Promise<void> {
    console.log('Login form submitted:', formData);
    this.isSubmitting.set(true);

    this.authService.login(formData.email, formData.password)
      .finally(() => this.isSubmitting.set(false))
      .then((success) => {
        if (success) {
          this.showToastNotification('success', 'Connexion réussie! Redirection en cours...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
            }, 2000);
          } else {
            this.showToastNotification('error', 'Email ou mot de passe incorrect');
          }
        })
      .catch((error) => {
        console.error('Login error:', error);
        this.alertService.error('Erreur de connexion', 'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.');
        this.showToastNotification('error', 'Une erreur est survenue lors de la connexion');
      });

  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotification.set(true);

    setTimeout(() => {
      this.showNotification.set(false);
    }, 5000);
  }
}