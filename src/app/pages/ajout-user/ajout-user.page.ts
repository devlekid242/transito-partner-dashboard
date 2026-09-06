import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { Utilisateur, RoleUtilisateur, SelectOption, Agence } from '../../models';

@Component({
  selector: 'app-ajout-user',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header
        [title]="pageTitle()"
        subtitle="Créez un compte pour un membre du personnel"
        icon="user-plus"
      >
        <a routerLink="/gestion-du-staff" class="btn btn-secondary"
          ><app-icon name="arrow-left" [size]="16" /> Retour</a
        >
      </app-page-header>
      <div class="card max-w-2xl p-6">
        @if (isLoading()) {
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <span class="ml-3">Chargement...</span>
          </div>
        } @else {
          <form [formGroup]="userForm" (ngSubmit)="save()" class="space-y-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="fullName">Nom complet</label>
                <input
                  id="fullName"
                  type="text"
                  class="input"
                  placeholder="Awa Traoré"
                  formControlName="fullName"
                  required
                />
                @if (userForm.get('fullName')?.invalid && userForm.get('fullName')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Nom complet est requis</p>
                }
              </div>
              <div>
                <label class="label" for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  class="input"
                  placeholder="awa@transito.ci"
                  formControlName="email"
                  required
                />
                @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Email est requis</p>
                }
              </div>
              <div>
                <label class="label" for="phoneNumber">Téléphone</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  class="input"
                  placeholder="+225 07 00 00 00"
                  formControlName="phoneNumber"
                  required
                />
                @if (userForm.get('phoneNumber')?.invalid && userForm.get('phoneNumber')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Téléphone est requis</p>
                }
              </div>
              <div>
                <label class="label" for="ville">Ville de résidence</label>
                <select
                  id="ville"
                  class="input cursor-pointer"
                  formControlName="ville"
                  required
                  [disabled]="isLoadingCities()"
                >
                  <option value="" disabled>
                    {{ isLoadingCities() ? 'Chargement des villes...' : 'Sélectionner une ville' }}
                  </option>
                  @for (city of cities(); track city.value) {
                    <option [value]="city.value">{{ city.label }}</option>
                  }
                </select>
                @if (userForm.get('ville')?.invalid && userForm.get('ville')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ville est requise</p>
                }
              </div>
              <div>
                <label class="label" for="quartier">Quartier</label>
                <input
                  id="quartier"
                  type="text"
                  class="input"
                  placeholder="Ex: Cocody"
                  formControlName="quartier"
                  required
                />
                @if (userForm.get('quartier')?.invalid && userForm.get('quartier')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Quartier est requis</p>
                }
              </div>
              <div>
                <label class="label" for="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  class="input"
                  placeholder="Laisser vide pour générer automatiquement"
                  formControlName="password"
                />
              </div>
              <div>
                <label class="label" for="agentRole">Rôle</label>
                <select
                  id="agentRole"
                  class="input cursor-pointer"
                  formControlName="agentRole"
                  required
                >
                  <option value="" disabled>Sélectionner un rôle</option>
                  @for (r of roleOptions(); track r.value) {
                    <option [value]="r.value">{{ r.label }}</option>
                  }
                </select>
                @if (userForm.get('agentRole')?.invalid && userForm.get('agentRole')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Rôle est requis</p>
                }
              </div>
              <div>
                <label class="label" for="status">Statut</label>
                <select id="status" class="input cursor-pointer" formControlName="status" required>
                  <option value="">Sélectionner un statut</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
                @if (userForm.get('status')?.invalid && userForm.get('status')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Statut est requis</p>
                }
              </div>
              @if (showAgencySelect()) {
                <div class="sm:col-span-2">
                  <label class="label" for="agencyId">Agence</label>
                  <select id="agencyId" class="input cursor-pointer" formControlName="agencyId">
                    <option value="">Sélectionner une agence</option>
                    @for (a of agencies(); track a.id) {
                      <option [value]="a.id">{{ a.nom }}</option>
                    }
                  </select>
                </div>
              }
            </div>
            <div class="flex justify-end gap-3 border-t border-ink-100 pt-5">
              <a routerLink="/gestion-du-staff" class="btn btn-secondary">Annuler</a>
              @if (isSubmitting()) {
                <button type="button" class="btn btn-primary" disabled>
                  <span class="animate-pulse">Enregistrement...</span>
                </button>
              } @else {
                <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                  <app-icon name="save" [size]="16" /> {{ submitLabel() }}
                </button>
              }
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class AjoutUserPage implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly roleOptions = signal<SelectOption[]>([]);
  readonly cities = signal<SelectOption[]>([]);
  readonly isLoadingCities = signal<boolean>(true);
  readonly agencies = signal<Agence[]>([]);

  // Form
  userForm: FormGroup;

  // Edit mode
  selectedUserId: string | null = null;
  readonly pageTitle = signal<string>('Ajouter un utilisateur');
  readonly submitLabel = signal<string>('Enregistrer');

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      ville: ['', [Validators.required]],
      quartier: ['', [Validators.required]],
      password: ['', []],
      agentRole: ['', [Validators.required]],
      status: ['active', [Validators.required]],
      agencyId: ['', []],
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();

    // Check for edit mode
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedUserId = idParam;
        this.pageTitle.set("Modifier l'utilisateur");
        this.submitLabel.set('Mettre à jour');
        this.loadUserDetails(idParam);
      } else {
        this.isLoading.set(false);
      }
    });
  }

  showAgencySelect(): boolean {
    const role = this.userForm.get('agentRole')?.value;
    return role && ['agent_quai', 'admin_agence'].includes(role);
  }

  loadReferenceData(): void {
    // Load role options
    this.roleOptions.set([
      { value: 'admin_agence', label: 'Administrateur' },
      { value: 'agent_quai', label: 'Agent de quai' },
    ]);

    // Load city options
    this.isLoadingCities.set(true);
    this.api.getCityOptions().subscribe({
      next: (options) => {
        this.cities.set(options);
        this.isLoadingCities.set(false);
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.toast.danger(err, 'Impossible de charger la liste des villes');
        this.isLoadingCities.set(false);
      },
    });

    // Load agencies
    this.api.getAgencies().subscribe({
      next: (agencies) => {
        this.agencies.set(agencies);
      },
      error: (err) => {
        console.error('Error loading agencies:', err);
      },
    });
  }

  loadUserDetails(userId: string): void {
    this.isLoading.set(true);
    this.api.getUserDetails(userId).subscribe({
      next: (user) => {
        const u = user as any;
        this.userForm.patchValue({
          fullName: u.fullName || u.nom || '',
          email: u.email || '',
          phoneNumber: u.phoneNumber || u.telephone || '',
          ville: u.ville || u.city || '',
          quartier: u.quartier || u.neighborhood || '',
          agentRole: u.agentRole || u.role || '',
          status: u.status || u.statut || 'active',
          agencyId: u.agencyId || u.agence?.id || '',
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading user details:', err);
        this.toast.danger(err, "Impossible de charger les détails de l'utilisateur");
        this.isLoading.set(false);
      },
    });
  }

  save(): void {
    if (this.userForm.invalid || this.isSubmitting()) {
      this.userForm.markAllAsTouched();
      this.toast.danger('Veuillez remplir les champs obligatoires.');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.userForm.value;
    const payload: any = {
      fullName: String(formValue.fullName).trim(),
      email: String(formValue.email).trim(),
      phoneNumber: String(formValue.phoneNumber).trim(),
      ville: String(formValue.ville).trim(),
      quartier: String(formValue.quartier).trim(),
      password: formValue.password || undefined,
      agent: {
        agentRole: formValue.agentRole,
        status: formValue.status,
      },
    };

    // Add agency if selected
    if (formValue.agencyId) {
      payload.agencyId = Number(formValue.agencyId);
    }

    const request$ = this.selectedUserId
      ? this.api.updateUser(this.selectedUserId, payload)
      : this.api.registerUser(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.toast.success(
          res,
          this.selectedUserId
            ? 'Utilisateur mis à jour avec succès.'
            : 'Utilisateur ajouté avec succès.',
        );
        this.router.navigate(['/gestion-du-staff']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error saving user:', err);
        this.toast.danger(
          err,
          this.selectedUserId
            ? "Impossible de mettre à jour l'utilisateur."
            : "Impossible d'ajouter l'utilisateur.",
        );
      },
    });
  }
}
