import { Component, OnInit } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../services/auth.service';
import { PartnerApiService } from '../../services/partner-api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-compte-utilisateur',
  templateUrl: './compte-utilisateur.page.html',
  styleUrls: ['./compte-utilisateur.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class CompteUtilisateurPage implements OnInit {
  // Active tab
  activeTab: 'profile' | 'security' | 'notifications' | 'preferences' = 'profile';

  ApibaseUrl: string = environment.baseApiUrl;
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
      key: 'phoneNumber',
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
      options: [],
    },
    {
      key: 'theme',
      label: 'Thème',
      type: 'select',
      required: true,
      options: [],
    },
  ];

  notificationsFormFields: FormField[] = [
    {
      key: 'notificationsEnabled',
      label: 'Activer les notifications',
      type: 'checkbox',
      required: false,
    },
  ];

  languageOptions: { value: string; label: string }[] = [];
  themeOptions: { value: string; label: string }[] = [];
  selectedLanguage: string = 'fr';
  selectedTheme: string = 'light';

  // Modal state
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isSubmitting = false;

  // remove empty constructor; use dependency-injected one below

  setActiveTab(tab: 'profile' | 'security' | 'notifications' | 'preferences'): void {
    this.activeTab = tab;
  }

  onProfileSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const payload = {
      fullName: formData.fullName ?? this.user?.fullName,
      email: formData.email ?? this.user?.email,
      phoneNumber: formData.phoneNumber ?? this.user?.phoneNumber,
    };

    this.partnerApiService.updatePartnerProfile(payload).subscribe({
      next: (profile) => {
        this.showToastNotification('success', 'Profil mis à jour avec succès !');
        this.applyUserUpdates(profile ?? payload);
        this.updateFormFields();
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.showToastNotification('error', 'Erreur lors de la mise à jour du profil');
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  onSecuritySubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      this.isSubmitting = false;
      return;
    }

    this.partnerApiService.updatePartnerPassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.showToastNotification('success', 'Mot de passe mis à jour avec succès !');
        this.modalTitle = 'Mot de Passe Mis à Jour';
        this.modalMessage = 'Votre mot de passe a été changé avec succès.';
        this.isModalOpen = true;
      },
      error: (err) => {
        console.error('Change password error', err);
        this.showToastNotification(
          'error',
          err?.error?.message ?? 'Erreur lors du changement de mot de passe',
        );
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  onNotificationsSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const payload = {
      prefNotifications: formData.notificationsEnabled ? 1 : 0,
    };

    this.partnerApiService.updatePartnerProfile(payload).subscribe({
      next: (profile) => {
        this.showToastNotification('success', 'Notifications mises à jour avec succès !');
        this.applyUserUpdates(profile ?? payload);
        this.updateFormFields();
      },
      error: () => {
        this.showToastNotification('error', 'Erreur lors de la mise à jour des notifications');
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
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
  user: any = {};

  constructor(
    private authService: AuthService,
    private partnerApiService: PartnerApiService,
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.partnerApiService.getLanguageOptions().subscribe((options) => {
      this.languageOptions = options;
      const idx = this.preferencesFormFields.findIndex((f) => f.key === 'language');
      if (idx !== -1) {
        this.preferencesFormFields[idx].options = options;
      }
      if (options.length && !options.some((option) => option.value === this.selectedLanguage)) {
        this.selectedLanguage = options[0].value;
      }
    });

    this.partnerApiService.getThemeOptions().subscribe((options) => {
      this.themeOptions = options;
      const idx = this.preferencesFormFields.findIndex((f) => f.key === 'theme');
      if (idx !== -1) {
        this.preferencesFormFields[idx].options = options;
      }
      if (options.length && !options.some((option) => option.value === this.selectedTheme)) {
        this.selectedTheme = options[0].value;
      }
    });
  }

  selectLanguage(value: string): void {
    this.selectedLanguage = value;
    this.preferencesFormFields = this.preferencesFormFields.map((field) =>
      field.key === 'language' ? { ...field, value } : field,
    );
  }

  selectTheme(value: string): void {
    this.selectedTheme = value;
    this.preferencesFormFields = this.preferencesFormFields.map((field) =>
      field.key === 'theme' ? { ...field, value } : field,
    );
  }

  private getDisplayRole(role?: string): string {
    return role?.toLowerCase().includes('partner') ? 'Administrateur Flotte' : 'Utilisateur';
  }

  private normalizeImageUrl(url?: string): string {
    if (!url) {
      return '';
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseApiUrl}${normalizedPath}`;
  }

  private applyUserUpdates(updates: Record<string, any>): void {
    const normalized = {
      fullName: updates['fullName'] ?? this.user?.fullName,
      email: updates['email'] ?? this.user?.email,
      phoneNumber: updates['phoneNumber'] ?? this.user?.phoneNumber,
      profilePhotoUrl: this.normalizeImageUrl(
        updates['profilePhotoUrl'] ?? this.user?.profilePhotoUrl,
      ),
      prefLanguage: updates['prefLanguage'] ?? this.user?.prefLanguage ?? 'fr',
      prefDarkMode: updates['prefDarkMode'] ?? this.user?.prefDarkMode ?? 0,
      prefNotifications: updates['prefNotifications'] ?? this.user?.prefNotifications ?? 1,
      role: updates['role'] ?? this.user?.role,
    };

    this.user = {
      ...this.user,
      ...normalized,
      profilePhotoUrl: normalized.profilePhotoUrl || this.user?.profilePhotoUrl || '',
      avatar: normalized.profilePhotoUrl || this.user?.avatar || this.user?.profilePhotoUrl || '',
    };

    this.selectedLanguage = normalized.prefLanguage;
    this.selectedTheme = normalized.prefDarkMode === 1 ? 'dark' : 'light';

    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.authService.setUser({
        ...currentUser,
        ...normalized,
        role: normalized.role ?? currentUser.role,
      } as UserProfile);
    }
  }

  loadUserData() {
    const user = this.authService.getUser();
    if (user) {
      type ExtendedUserProfile = UserProfile & {
        profilePhotoUrl?: string;
        profilePhoto?: string;
        photoUrl?: string;
        prefLanguage?: string;
        prefDarkMode?: number;
        prefNotifications?: number;
      };
      const userProfile = user as ExtendedUserProfile;
      this.applyUserUpdates({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePhotoUrl: this.normalizeImageUrl(
          userProfile.profilePhotoUrl || userProfile.photoUrl || userProfile.profilePhoto || '',
        ),
        prefLanguage: userProfile.prefLanguage ?? 'fr',
        prefDarkMode: userProfile.prefDarkMode ?? 0,
        prefNotifications: userProfile.prefNotifications ?? 1,
      });

      this.updateFormFields();
    } else {
      // If auth service has no user cached, try fetching profile from API
      this.partnerApiService.getPartnerProfile().subscribe(
        (p: any) => {
          this.applyUserUpdates({
            fullName: p?.fullName ?? `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim(),
            email: p?.email ?? '',
            phoneNumber: p?.phone ?? p?.phoneNumber ?? '',
            role: p?.role,
            profilePhotoUrl: this.normalizeImageUrl(p?.profilePhotoUrl ?? ''),
            prefLanguage: p?.prefLanguage ?? 'fr',
            prefDarkMode: p?.prefDarkMode ?? 0,
            prefNotifications: p?.prefNotifications ?? 1,
          });
          this.updateFormFields();
        },
        () => {},
      );
    }
  }

  updateFormFields() {
    this.profileFormFields = this.profileFormFields.map((field) => ({
      ...field,
      placeholder: field.placeholder,
      value: this.user[field.key] ?? this.user[field.key as keyof typeof this.user],
    }));

    this.notificationsFormFields = this.notificationsFormFields.map((field) => ({
      ...field,
      value: this.user.prefNotifications === 1,
    }));

    this.preferencesFormFields = this.preferencesFormFields.map((field) => {
      if (field.key === 'language') {
        return { ...field, value: this.selectedLanguage };
      }
      if (field.key === 'theme') {
        return { ...field, value: this.selectedTheme };
      }
      return field;
    });
  }

  // Photo upload
  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.partnerApiService.updateProfilePhoto(file).subscribe(
      (res) => {
        this.showToastNotification('success', 'Photo de profil mise à jour.');
        const photoUrl = this.normalizeImageUrl(
          res.photoUrl || (res as { profilePhotoUrl?: string }).profilePhotoUrl || '',
        );
        this.user.profilePhotoUrl = photoUrl;
        this.user.avatar = photoUrl;
        this.applyUserUpdates({ profilePhotoUrl: photoUrl });
      },
      (err) => {
        console.error('Profile photo upload error', err);
        this.showToastNotification('error', 'Erreur lors de l upload de la photo');
      },
    );
  }

  // Preferences save
  onPreferencesSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const payload: Record<string, any> = {};
    if (formData.language) payload['prefLanguage'] = formData.language;
    if (formData.theme) payload['prefDarkMode'] = formData.theme === 'dark' ? 1 : 0;

    if (!Object.keys(payload).length) {
      this.isSubmitting = false;
      this.showToastNotification('warning', 'Aucune préférence à enregistrer.');
      return;
    }

    this.partnerApiService.updatePartnerProfile(payload).subscribe({
      next: () => {
        this.showToastNotification('success', 'Préférences mises à jour.');
        this.applyUserUpdates(payload);
        this.updateFormFields();
      },
      error: () =>
        this.showToastNotification('error', 'Erreur lors de la mise à jour des préférences'),
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
