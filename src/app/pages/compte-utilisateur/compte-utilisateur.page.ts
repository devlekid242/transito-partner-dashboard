import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { AuthService } from '../../services/auth.service';
import { PartnerApiService } from '../../services/partner-api.service';
import { SelectOption } from '../../models';

@Component({
  selector: 'app-compte-utilisateur',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent],
  templateUrl:'./compte-utilisateur.page.html',
})
export class CompteUtilisateurPage implements OnInit {
  private auth = inject(AuthService);
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly activeTab = signal<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  readonly languageOptions = signal<SelectOption[]>([]);
  readonly themeOptions = signal<SelectOption[]>([]);

  readonly tabs = [
    { key: 'profile' as const, label: 'Profil' },
    { key: 'security' as const, label: 'Sécurité' },
    { key: 'notifications' as const, label: 'Notifications' },
    // { key: 'preferences' as const, label: 'Préférences' },
  ];

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
  });

  securityForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: (form: FormGroup) =>
    form.get('newPassword')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true }
  });

  notificationsForm = this.fb.group({
    notificationsEnabled: [true],
  });

  preferencesForm = this.fb.group({
    language: ['fr', Validators.required],
    theme: ['light', Validators.required],
  });

  userName = computed(() => this.auth.getUser()?.fullName || 'Utilisateur');
  userEmail = computed(() => this.auth.getUser()?.email || '');
  userRole = computed(() => this.auth.getUser()?.role || 'Utilisateur');
  profilePhoto = computed(() => this.auth.getUser()?.profilePhotoUrl || '');

  initials = computed(() => {
    const parts = this.userName().split(/\s+/).filter(Boolean);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.slice(0, 2) || 'U').toUpperCase();
  });

  ngOnInit(): void {
    this.loadProfile();
    this.api.getLanguageOptions().subscribe({
      next: (options) => this.languageOptions.set(options),
      error: () => this.languageOptions.set([]),
    });
    this.api.getThemeOptions().subscribe({
      next: (options) => this.themeOptions.set(options),
      error: () => this.themeOptions.set([]),
    });
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.api.getPartnerProfile().subscribe({
      next: (profile: any) => {
        const user = profile?.user || profile;
        this.auth.setUser({
          ...(this.auth.getUser() || {}),
          id: user?.id || this.auth.getUser()?.id || 0,
          fullName: user?.fullName || user?.nom || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || user?.phone || user?.telephone || '',
          role: user?.role || this.auth.getUser()?.role,
          profilePhotoUrl: user?.profilePhotoUrl || user?.photoUrl || '',
          prefLanguage: user?.prefLanguage ?? 'fr',
          prefDarkMode: user?.prefDarkMode ?? 0,
          prefNotifications: user?.prefNotifications ?? 1,
        } as any);
        this.patchForms(this.auth.getUser());
        this.isLoading.set(false);
      },
      error: () => {
        this.patchForms(this.auth.getUser());
        this.isLoading.set(false);
      },
    });
  }

  private patchForms(user: any): void {
    this.profileForm.patchValue({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    });
    this.notificationsForm.patchValue({ notificationsEnabled: user?.prefNotifications !== 0 });
    this.preferencesForm.patchValue({
      language: user?.prefLanguage || 'fr',
      theme: user?.prefDarkMode === 1 ? 'dark' : 'light',
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isSubmitting()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.api.updatePartnerProfile(this.profileForm.getRawValue()).subscribe({
      next: (profile) => {
        const current = this.auth.getUser();
        this.auth.setUser({ ...current, ...(profile as any), fullName: this.profileForm.value.fullName, email: this.profileForm.value.email, phoneNumber: this.profileForm.value.phoneNumber } as any);
        this.toast.success('Profil mis à jour avec succès.');
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toast.danger('Impossible de mettre à jour le profil.');
        this.isSubmitting.set(false);
      },
    });
  }

  savePassword(): void {
    if (this.securityForm.invalid || this.isSubmitting()) {
      this.securityForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const { currentPassword, newPassword } = this.securityForm.getRawValue();
    this.api.updatePartnerPassword(currentPassword || '', newPassword || '').subscribe({
      next: () => {
        this.toast.success('Mot de passe mis à jour avec succès.');
        this.securityForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toast.danger(err?.error?.message || 'Erreur lors du changement de mot de passe.');
        this.isSubmitting.set(false);
      },
    });
  }

  saveNotifications(): void {
    this.saveProfilePreference({
      prefNotifications: this.notificationsForm.value.notificationsEnabled ? 1 : 0,
    });
  }

  savePreferences(): void {
    this.saveProfilePreference({
      prefLanguage: this.preferencesForm.value.language,
      prefDarkMode: this.preferencesForm.value.theme === 'dark' ? 1 : 0,
    });
  }

  private saveProfilePreference(payload: Record<string, any>): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.api.updatePartnerProfile(payload).subscribe({
      next: (profile) => {
        this.auth.setUser({ ...(this.auth.getUser() || {}), ...(profile as any), ...payload } as any);
        this.toast.success('Préférences mises à jour avec succès.');
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toast.danger('Impossible d’enregistrer les préférences.');
        this.isSubmitting.set(false);
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.danger('Veuillez sélectionner une image.');
      return;
    }
    this.api.updateProfilePhoto(file).subscribe({
      next: (response) => {
        const current = this.auth.getUser();
        this.auth.setUser({ ...(current as any), profilePhotoUrl: response.photoUrl } as any);
        this.toast.success('Photo de profil mise à jour.');
      },
      error: () => this.toast.danger('Impossible de mettre à jour la photo.'),
    });
  }
}
