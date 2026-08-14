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
  template: `
    <div class="space-y-6">
      <app-page-header title="Compte utilisateur" subtitle="Gérez vos informations personnelles, votre sécurité et vos préférences" icon="user-circle" />

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement du profil...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="card p-6">
            <div class="flex flex-col items-center text-center">
              @if (profilePhoto()) {
                <img [src]="profilePhoto()" alt="Photo de profil" class="h-24 w-24 rounded-full object-cover ring-4 ring-brand-50" />
              } @else {
                <div class="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">{{ initials() }}</div>
              }
              <h3 class="mt-4 text-lg font-bold text-ink-900">{{ userName() }}</h3>
              <p class="text-sm text-ink-500">{{ userEmail() }}</p>
              <span class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
                <app-icon name="shield-check" [size]="13" /> {{ userRole() }}
              </span>
              <label class="btn btn-secondary mt-5 cursor-pointer">
                <app-icon name="camera" [size]="16" /> Changer la photo
                <input type="file" class="hidden" accept="image/*" (change)="onPhotoSelected($event)" />
              </label>
            </div>
          </div>

          <div class="card p-6 lg:col-span-2">
            <div class="flex flex-wrap gap-2 border-b border-ink-100 pb-4">
              @for (tab of tabs; track tab.key) {
                <button type="button" class="rounded-lg px-4 py-2 text-sm font-semibold"
                  [class]="activeTab() === tab.key ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50'"
                  (click)="activeTab.set(tab.key)">
                  {{ tab.label }}
                </button>
              }
            </div>

            @if (activeTab() === 'profile') {
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mt-5 space-y-5">
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label class="label" for="fullName">Nom complet</label>
                    <input id="fullName" class="input" formControlName="fullName" />
                    @if (profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched) {
                      <p class="mt-1 text-xs text-red-500">Nom complet requis.</p>
                    }
                  </div>
                  <div>
                    <label class="label" for="email">Adresse email</label>
                    <input id="email" type="email" class="input" formControlName="email" />
                    @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                      <p class="mt-1 text-xs text-red-500">Adresse email valide requise.</p>
                    }
                  </div>
                  <div>
                    <label class="label" for="phoneNumber">Téléphone</label>
                    <input id="phoneNumber" type="tel" class="input" formControlName="phoneNumber" />
                  </div>
                </div>
                <div class="flex justify-end border-t border-ink-100 pt-5">
                  <button class="btn btn-primary" type="submit" [disabled]="isSubmitting()">
                    <app-icon name="save" [size]="16" /> Enregistrer
                  </button>
                </div>
              </form>
            }

            @if (activeTab() === 'security') {
              <form [formGroup]="securityForm" (ngSubmit)="savePassword()" class="mt-5 space-y-5">
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="label" for="currentPassword">Mot de passe actuel</label>
                    <input id="currentPassword" type="password" class="input" formControlName="currentPassword" />
                  </div>
                  <div>
                    <label class="label" for="newPassword">Nouveau mot de passe</label>
                    <input id="newPassword" type="password" class="input" formControlName="newPassword" />
                    @if (securityForm.get('newPassword')?.invalid && securityForm.get('newPassword')?.touched) {
                      <p class="mt-1 text-xs text-red-500">Minimum 8 caractères.</p>
                    }
                  </div>
                  <div>
                    <label class="label" for="confirmPassword">Confirmation</label>
                    <input id="confirmPassword" type="password" class="input" formControlName="confirmPassword" />
                  </div>
                </div>
                @if (securityForm.hasError('mismatch') && securityForm.get('confirmPassword')?.touched) {
                  <p class="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                }
                <div class="flex justify-end border-t border-ink-100 pt-5">
                  <button class="btn btn-primary" type="submit" [disabled]="isSubmitting()">
                    <app-icon name="lock" [size]="16" /> Modifier le mot de passe
                  </button>
                </div>
              </form>
            }

            @if (activeTab() === 'notifications') {
              <form [formGroup]="notificationsForm" (ngSubmit)="saveNotifications()" class="mt-5 space-y-5">
                <label class="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
                  <input type="checkbox" formControlName="notificationsEnabled" class="h-4 w-4" />
                  <span>
                    <span class="block font-semibold text-ink-800">Activer les notifications</span>
                    <span class="block text-sm text-ink-500">Recevoir les notifications de l'activité de l'agence.</span>
                  </span>
                </label>
                <div class="flex justify-end">
                  <button class="btn btn-primary" type="submit" [disabled]="isSubmitting()"><app-icon name="save" [size]="16" /> Enregistrer</button>
                </div>
              </form>
            }

            @if (activeTab() === 'preferences') {
              <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()" class="mt-5 space-y-5">
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label class="label" for="language">Langue</label>
                    <select id="language" class="input cursor-pointer" formControlName="language">
                      @for (option of languageOptions(); track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="label" for="theme">Thème</label>
                    <select id="theme" class="input cursor-pointer" formControlName="theme">
                      @for (option of themeOptions(); track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="flex justify-end">
                  <button class="btn btn-primary" type="submit" [disabled]="isSubmitting()"><app-icon name="save" [size]="16" /> Enregistrer</button>
                </div>
              </form>
            }
          </div>
        </div>
      }
    </div>
  `,
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
    { key: 'preferences' as const, label: 'Préférences' },
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
