import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../../components/form/form.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { PartnerApiService } from '../../../services/partner-api.service';
import { environment } from '../../../../environments/environment';

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

  // Hero image for the left pane
  heroImage: string = environment.baseApiUrl + '/assets/hero-login.jpg';

  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private partnerApiService: PartnerApiService,
  ) {
    this.partnerApiService.getPartnerProfile().subscribe(
      (p) => {
        this.heroImage = this.normalizeImageUrl(p?.profilePhotoUrl ?? this.heroImage);
      },
      () => {
        // keep default
      },
    );
  }

  private normalizeImageUrl(url: string): string {
    if (!url) {
      return this.heroImage;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseApiUrl}${normalizedPath}`;
  }

  async onFormSubmit(formData: any): Promise<void> {
    console.log('Login form submitted:', formData);
    this.isSubmitting = true;
    // Call the auth service to login
    const success = await this.authService.login(formData.email, formData.password);

    this.isSubmitting = false;

    if (success) {
      // Successful login
      this.showToastNotification('success', 'Connexion réussie! Redirection en cours...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
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
