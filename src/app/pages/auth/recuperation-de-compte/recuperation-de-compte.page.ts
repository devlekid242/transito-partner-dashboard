import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../../components/form/form.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { PartnerApiService } from '../../../services/partner-api.service';
import { environment } from '../../../../environments/environment';

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

  heroImage: string = environment.baseApiUrl + '/assets/hero-login.jpg';

  constructor(
    private authService: AuthService,
    private router: Router,
    private partnerApiService: PartnerApiService,
  ) {
    this.partnerApiService.getPartnerProfile().subscribe(
      (p) => {
        this.heroImage = this.normalizeImageUrl(p?.profilePhotoUrl ?? this.heroImage);
      },
      () => {},
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

  // Gestion de la soumission du formulaire
  async onSubmit(formData: any): Promise<void> {
    this.isLoading = true;

    try {
      // Call the auth service to request password reset
      // Note: This is a mock implementation since the backend doesn't have this endpoint yet
      // In a real implementation, you would call:
      // const success = await this.authService.requestReset(formData.email);

      // For now, we'll simulate a successful request
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.isLoading = false;
      this.isSent = true;
      this.showToastNotification('success', 'Lien de récupération envoyé avec succès!');

      // Reset button state after 3 seconds
      setTimeout(() => {
        this.isSent = false;
        this.router.navigate(['/connexion']);
      }, 3000);
    } catch (error) {
      this.isLoading = false;
      console.error('Password reset error:', error);
      this.showToastNotification('error', "Erreur lors de l'envoi du lien de récupération");
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
