import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { PointEmbarquement, BusPoint, SelectOption } from '../../models';

@Component({
  selector: 'app-ajout-point-embarquement',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header [title]="pageTitle()" subtitle="Enregistrez un nouvel arrêt" icon="map-pin">
        <a routerLink="/gestion-point-embarquement" class="btn btn-secondary">
          <app-icon name="arrow-left" [size]="16" /> Retour
        </a>
      </app-page-header>

      <div class="card max-w-2xl p-6">
        @if (isLoading()) {
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <span class="ml-3">Chargement...</span>
          </div>
        } @else {
          <form [formGroup]="pointForm" (ngSubmit)="save()" class="space-y-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="nom">Nom du point</label>
                <input id="nom" class="input" placeholder="Gare de Bassam" formControlName="nom" required />
                @if (pointForm.get('nom')?.invalid && pointForm.get('nom')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Nom est requis</p>
                }
              </div>
              <div>
                <label class="label" for="ville">Ville</label>
                <select id="ville" class="input cursor-pointer" formControlName="ville" required [disabled]="isLoadingCities()">
                  <option value="" disabled>
                    {{ isLoadingCities() ? 'Chargement des villes...' : 'Sélectionner une ville' }}
                  </option>
                  @for (city of cities(); track city.value) {
                    <option [value]="city.value">{{ city.label }}</option>
                  }
                </select>
                @if (pointForm.get('ville')?.invalid && pointForm.get('ville')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ville est requise</p>
                }
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="adresse">Adresse</label>
                <input id="adresse" class="input" placeholder="Bd de la Paix" formControlName="adresse" required />
                @if (pointForm.get('adresse')?.invalid && pointForm.get('adresse')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Adresse est requise</p>
                }
              </div>
              <div>
                <label class="label" for="quartier">Quartier</label>
                <input id="quartier" class="input" formControlName="quartier" />
              </div>
              <div>
                <label class="label" for="phoneNumber">Téléphone</label>
                <input id="phoneNumber" type="tel" class="input" formControlName="phoneNumber" />
              </div>
              <div>
                <label class="label" for="latitude">Latitude</label>
                <input id="latitude" type="number" step="any" class="input" formControlName="latitude" />
              </div>
              <div>
                <label class="label" for="longitude">Longitude</label>
                <input id="longitude" type="number" step="any" class="input" formControlName="longitude" />
              </div>
              <div>
                <label class="label" for="pointType">Type de point</label>
                <select id="pointType" class="input cursor-pointer" formControlName="pointType">
                  <option value="principal">Principal</option>
                  <option value="premium">Premium</option>
                  <option value="express">Express</option>
                  <option value="crossborder">International</option>
                </select>
              </div>
              <div>
                <label class="label" for="embarkationTime">Heure d'embarquement</label>
                <input id="embarkationTime" type="time" class="input" formControlName="embarkationTime" required />
                @if (pointForm.get('embarkationTime')?.invalid && pointForm.get('embarkationTime')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Heure est requise</p>
                }
              </div>
              <div>
                <label class="label" for="status">Statut</label>
                <select id="status" class="input cursor-pointer" formControlName="status" required>
                  <option value="">Sélectionner un statut</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
                @if (pointForm.get('status')?.invalid && pointForm.get('status')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Statut est requis</p>
                }
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 rounded-xl border border-ink-100 p-4 sm:grid-cols-4">
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="hasWifi" /> Wi-Fi</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="hasAc" /> Climatisation</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="hasVipLounge" /> Salon VIP</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" formControlName="hasParking" /> Parking</label>
            </div>
            <div class="flex justify-end gap-3 border-t border-ink-100 pt-5">
              <a routerLink="/gestion-point-embarquement" class="btn btn-secondary">Annuler</a>
              @if (isSubmitting()) {
                <button type="button" class="btn btn-primary" disabled>
                  <span class="animate-pulse">Enregistrement...</span>
                </button>
              } @else {
                <button type="submit" class="btn btn-primary" [disabled]="pointForm.invalid">
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
export class AjoutPointEmbarquementPage implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Villes actives disponibles pour le select
  readonly cities = signal<SelectOption[]>([]);
  readonly isLoadingCities = signal<boolean>(true);

  // Form
  pointForm: FormGroup;

  // Edit mode
  selectedPointId: string | null = null;
  readonly pageTitle = signal<string>('Ajouter un point d\'embarquement');
  readonly submitLabel = signal<string>('Enregistrer');

  constructor() {
    this.pointForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      ville: ['', [Validators.required]],
      adresse: ['', [Validators.required, Validators.maxLength(200)]],
      quartier: [''],
      phoneNumber: [''],
      latitude: [null],
      longitude: [null],
      pointType: ['principal', [Validators.required]],
      embarkationTime: ['06:00', [Validators.required]],
      status: ['actif', [Validators.required]],
      hasWifi: [false],
      hasAc: [false],
      hasVipLounge: [false],
      hasParking: [false],
    });
  }

  ngOnInit(): void {
    // Check for edit mode
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedPointId = idParam;
        this.pageTitle.set('Modifier le point d\'embarquement');
        this.submitLabel.set('Mettre à jour');
        this.loadCitiesAndPointDetails(idParam);
      } else {
        this.isLoading.set(false);
        this.loadCities();
      }
    });
  }

  /** Charge la liste des villes actives (mode création). */
  private loadCities(): void {
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
  }

  /**
   * Charge en parallèle les villes actives et le détail du point (mode édition),
   * puis pré-remplit le formulaire. Si la ville du point n'est plus active,
   * elle est réinjectée dans la liste (marquée "inactive") pour rester sélectionnable.
   */
  private loadCitiesAndPointDetails(pointId: string): void {
    this.isLoading.set(true);
    this.isLoadingCities.set(true);

    forkJoin({
      cities: this.api.getCityOptions().pipe(catchError(() => of([] as SelectOption[]))),
      point: this.api.getBusPointDetail(pointId),
    }).subscribe({
      next: ({ cities, point }) => {
        const p = point as any;
        const villeValue = p.ville || p.city || '';

        const options =
          villeValue && !cities.some((c) => c.value === villeValue)
            ? [...cities, { value: villeValue, label: `${villeValue} (inactive)` }]
            : cities;

        this.cities.set(options);
        this.isLoadingCities.set(false);

        this.pointForm.patchValue({
          nom: p.nom || p.name || '',
          ville: villeValue,
          adresse: p.adresse || p.address || '',
          quartier: p.quartier || '',
          phoneNumber: p.phoneNumber || '',
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          pointType: p.pointType || 'principal',
          embarkationTime: p.embarkationTime || p.heure || '06:00',
          status: p.status || p.statut || 'actif',
          hasWifi: !!p.hasWifi,
          hasAc: !!p.hasAc,
          hasVipLounge: !!p.hasVipLounge,
          hasParking: !!p.hasParking,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading point details:', err);
        this.toast.danger(err, 'Impossible de charger les détails du point d\'embarquement');
        this.isLoading.set(false);
        this.isLoadingCities.set(false);
      },
    });
  }

  save(): void {
    if (this.pointForm.invalid || this.isSubmitting()) {
      this.pointForm.markAllAsTouched();
      this.toast.danger('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.pointForm.value;
    const payload: Partial<BusPoint> = {
      name: String(formValue.nom).trim(),
      city: String(formValue.ville).trim(),
      address: String(formValue.adresse).trim(),
      quartier: String(formValue.quartier || '').trim(),
      phoneNumber: String(formValue.phoneNumber || '').trim(),
      latitude: formValue.latitude == null || formValue.latitude === '' ? undefined : Number(formValue.latitude),
      longitude: formValue.longitude == null || formValue.longitude === '' ? undefined : Number(formValue.longitude),
      pointType: formValue.pointType,
      embarkationTime: formValue.embarkationTime,
      status: formValue.status,
      hasWifi: formValue.hasWifi ? 1 : 0,
      hasAc: formValue.hasAc ? 1 : 0,
      hasVipLounge: formValue.hasVipLounge ? 1 : 0,
      hasParking: formValue.hasParking ? 1 : 0,
    };

    const request$ = this.selectedPointId
      ? this.api.updateBusPoint(this.selectedPointId, payload)
      : this.api.addBusPoint(payload);

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.toast.success(
          res,
          this.selectedPointId
            ? 'Point d\'embarquement mis à jour avec succès.'
            : 'Point d\'embarquement ajouté avec succès.'
        );
        this.router.navigate(['/gestion-point-embarquement']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error saving point:', err);
        this.toast.danger(
          err,
          this.selectedPointId
            ? 'Impossible de mettre à jour le point d\'embarquement.'
            : 'Impossible d\'ajouter le point d\'embarquement.'
        );
      },
    });
  }
}