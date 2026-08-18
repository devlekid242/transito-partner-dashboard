import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { Trajet, Bus, BusPoint, SelectOption } from '../../models';

@Component({
  selector: 'app-ajout-trajet',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header [title]="pageTitle()" subtitle="Planifiez un nouveau départ" icon="route">
        <a routerLink="/trip-schedule" class="btn btn-secondary"><app-icon name="arrow-left" [size]="16" /> Retour</a>
      </app-page-header>
      <div class="card max-w-3xl p-6">
        <div class="mb-6 flex items-center gap-2 border-b border-ink-100 pb-4 text-sm font-semibold text-brand-700">
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">1</span> Informations du trajet
        </div>
        @if (isLoading()) {
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            <span class="ml-3">Chargement...</span>
          </div>
        } @else {
          <form [formGroup]="tripForm" (ngSubmit)="save()" class="space-y-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="label" for="departureCity">Ville de départ</label>
                <select id="departureCity" class="input cursor-pointer" formControlName="departureCity" required [disabled]="isLoadingCities()">
                  <option value="" disabled>
                    {{ isLoadingCities() ? 'Chargement des villes...' : 'Sélectionner une ville' }}
                  </option>
                  @for (c of cityOptions(); track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
                @if (tripForm.get('departureCity')?.invalid && tripForm.get('departureCity')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ville de départ est requis</p>
                }
              </div>
              <div>
                <label class="label" for="arrivalCity">Ville d'arrivée</label>
                <select id="arrivalCity" class="input cursor-pointer" formControlName="arrivalCity" required [disabled]="isLoadingCities()">
                  <option value="" disabled>
                    {{ isLoadingCities() ? 'Chargement des villes...' : 'Sélectionner une ville' }}
                  </option>
                  @for (c of cityOptions(); track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
                @if (tripForm.get('arrivalCity')?.invalid && tripForm.get('arrivalCity')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ville d'arrivée est requis</p>
                }
                @if (tripForm.hasError('sameCity') && tripForm.get('arrivalCity')?.touched) {
                  <p class="text-red-500 text-xs mt-1">La ville d'arrivée doit être différente de la ville de départ</p>
                }
              </div>
              <div>
                <label class="label" for="tripDate">Date de départ</label>
                <input id="tripDate" type="date" class="input" formControlName="tripDate" required />
                @if (tripForm.get('tripDate')?.invalid && tripForm.get('tripDate')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Date de départ est requis</p>
                }
              </div>
              <div>
                <label class="label" for="departureTimeOfDay">Heure de départ</label>
                <input id="departureTimeOfDay" type="time" class="input" formControlName="departureTimeOfDay" required />
                @if (tripForm.get('departureTimeOfDay')?.invalid && tripForm.get('departureTimeOfDay')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Heure de départ est requis</p>
                }
              </div>
              <div>
                <label class="label" for="arrivalTimeOfDay">Heure d'arrivée estimée</label>
                <input id="arrivalTimeOfDay" type="time" class="input" formControlName="arrivalTimeOfDay" />
              </div>
              <div>
                <label class="label" for="price">Prix du billet (FCFA)</label>
                <input id="price" type="number" class="input" placeholder="8000" formControlName="price" required min="0" />
                @if (tripForm.get('price')?.invalid && tripForm.get('price')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Prix doit être positif</p>
                }
              </div>
              <div>
                <label class="label" for="busId">Bus assigné</label>
                <select id="busId" class="input cursor-pointer" formControlName="busId" required>
                  <option value="">Sélectionner un bus</option>
                  @for (b of buses(); track b.id) {
                    <option [value]="b.id">{{ b.registrationNumber }} — {{ b.brand }} — {{ b.model }}</option>
                  }
                </select>
                @if (tripForm.get('busId')?.invalid && tripForm.get('busId')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Bus est requis</p>
                }
              </div>
              <div>
                <label class="label" for="driverName">Nom du chauffeur</label>
                <input id="driverName" type="text" class="input" placeholder="Jean Michel" formControlName="driverName" />
              </div>
              <div>
                <label class="label" for="seatsReserved">Places réservées</label>
                <input id="seatsReserved" type="number" class="input" placeholder="0" formControlName="seatsReserved" min="0" />
              </div>
              <div>
                <label class="label" for="status">Statut du trajet</label>
                <select id="status" class="input cursor-pointer" formControlName="status" required>
                  <option value="">Sélectionner un statut</option>
                  @for (s of statusOptions(); track s.value) {
                    <option [value]="s.value">{{ s.label }}</option>
                  }
                </select>
                @if (tripForm.get('status')?.invalid && tripForm.get('status')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Statut est requis</p>
                }
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="boardingPointIds">Points d'embarquement</label>
                <select id="boardingPointIds" class="input cursor-pointer" formControlName="boardingPointIds" multiple>
                  @for (p of busPoints(); track p.id) {
                    <option [value]="p.id">{{ p.name || p.address || p.city }}</option>
                  }
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="deboardingPointIds">Points de débarquement</label>
                <select id="deboardingPointIds" class="input cursor-pointer" formControlName="deboardingPointIds" multiple>
                  @for (p of busPoints(); track p.id) {
                    <option [value]="p.id">{{ p.name || p.address || p.city }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 border-t border-ink-100 pt-5">
              <a routerLink="/trip-schedule" class="btn btn-secondary">Annuler</a>
              @if (isSubmitting()) {
                <button type="button" class="btn btn-primary" disabled>
                  <span class="animate-pulse">Enregistrement...</span>
                </button>
              } @else {
                <button type="submit" class="btn btn-primary" [disabled]="tripForm.invalid">
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
export class AjoutTrajetPage implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly buses = this.api.bus;
  readonly busPoints = this.api.pointsEmbarquement;
  readonly statusOptions = signal<SelectOption[]>(
    [
      {
        label:'Planifier',
        value:'planifie'
      },
      {
        label:'Embarquement',
        value:'embarquement'
      },
      {
        label:'En route',
        value:'en_route'
      },
      {
        label:'Terminer',
        value:'termine'
      },
      {
        label:'Annuler',
        value:'annule'
      },
    ]
  ); 

  // Villes actives disponibles pour les selects départ / arrivée
  readonly cityOptions = signal<SelectOption[]>([]);
  readonly isLoadingCities = signal<boolean>(true);

  // Form
  tripForm: FormGroup;

  // Edit mode
  selectedTripId: string | null = null;
  readonly pageTitle = signal<string>('Ajouter un trajet');
  readonly submitLabel = signal<string>('Publier le trajet');

  constructor() {
    this.tripForm = this.fb.group(
      {
        departureCity: ['', [Validators.required, Validators.maxLength(100)]],
        arrivalCity: ['', [Validators.required, Validators.maxLength(100)]],
        tripDate: ['', [Validators.required]],
        departureTimeOfDay: ['', [Validators.required]],
        arrivalTimeOfDay: ['', []],
        busId: ['', [Validators.required]],
        price: [0, [Validators.required, Validators.min(0)]],
        driverName: ['', [Validators.maxLength(100)]],
        seatsReserved: [0, [Validators.min(0)]],
        status: ['planifie', [Validators.required]],
        boardingPointIds: [[], []],
        deboardingPointIds: [[], []],
      },
      { validators: [this.differentCitiesValidator] },
    );
  }

  ngOnInit(): void {
    // Check for edit mode
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedTripId = idParam;
        this.pageTitle.set('Modifier le trajet');
        this.submitLabel.set('Mettre à jour');
        this.loadCitiesAndTripDetails(idParam);
      } else {
        this.isLoading.set(false);
        this.loadCities();
      }
      this.loadReferenceData();
    });
  }

  /** Refuse un trajet dont la ville de départ et d'arrivée seraient identiques. */
  private differentCitiesValidator(group: FormGroup) {
    const departure = group.get('departureCity')?.value;
    const arrival = group.get('arrivalCity')?.value;
    return departure && arrival && departure === arrival ? { sameCity: true } : null;
  }

  /** Charge la liste des villes actives (mode création). */
  private loadCities(): void {
    this.isLoadingCities.set(true);
    this.api.getCityOptions().subscribe({
      next: (options) => {
        this.cityOptions.set(options);
        this.isLoadingCities.set(false);
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.toast.danger('Impossible de charger la liste des villes');
        this.isLoadingCities.set(false);
      },
    });
  }

  /**
   * Charge en parallèle les villes actives et le détail du trajet (mode édition),
   * puis pré-remplit le formulaire. Si la ville de départ/arrivée du trajet n'est
   * plus active, elle est réinjectée dans la liste (marquée "inactive") pour rester
   * sélectionnable.
   */
  private loadCitiesAndTripDetails(tripId: string): void {
    this.isLoading.set(true);
    this.isLoadingCities.set(true);

    forkJoin({
      cities: this.api.getCityOptions().pipe(catchError(() => of([] as SelectOption[]))),
      trip: this.api.getTripDetails(tripId),
    }).subscribe({
      next: ({ cities, trip }) => {
        const t = trip as any;
        const departureCity = t.departureCity || t.origine || '';
        const arrivalCity = t.arrivalCity || t.destination || '';

        let options = cities;
        for (const cityName of [departureCity, arrivalCity]) {
          if (cityName && !options.some((c) => c.value === cityName)) {
            options = [...options, { value: cityName, label: `${cityName} (inactive)` }];
          }
        }
        this.cityOptions.set(options);
        this.isLoadingCities.set(false);

        this.tripForm.patchValue({
          departureCity,
          arrivalCity,
          tripDate: t.tripDate || t.dateDepart || '',
          departureTimeOfDay: t.departureTimeOfDay || (t.departureTime ? t.departureTime.split('T')[1]?.slice(0, 5) : '') || '',
          arrivalTimeOfDay: t.arrivalTimeOfDay || (t.estimatedArrivalTime ? t.estimatedArrivalTime.split('T')[1]?.slice(0, 5) : '') || '',
          busId: t.busId || t.bus?.id || '',
          price: t.price || 0,
          driverName: t.driverName || '',
          seatsReserved: t.seatsReserved || t.placesReservees || 0,
          status: t.status || t.statut || 'planifie',
          boardingPointIds: t.boardingPoints?.map((p: any) => String(p.id)) || t.boardingPointIds || [],
          deboardingPointIds: t.deboardingPoints?.map((p: any) => String(p.id)) || t.deboardingPointIds || [],
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading trip details:', err);
        this.toast.danger('Impossible de charger les détails du trajet');
        this.isLoading.set(false);
        this.isLoadingCities.set(false);
      },
    });
  }

  loadReferenceData(): void {
    // Buses and points are already loaded via signals in the service
    // but we need to ensure they're loaded
    if (this.api.bus().length === 0) {
      this.api.getBuses().subscribe();
    }
    if (this.api.pointsEmbarquement().length === 0) {
      this.api.getBusPoints().subscribe();
    }
  }

  save(): void {
    if (this.tripForm.invalid || this.isSubmitting()) {
      this.tripForm.markAllAsTouched();
      if (this.tripForm.hasError('sameCity')) {
        this.toast.danger("La ville d'arrivée doit être différente de la ville de départ.");
      } else {
        this.toast.danger('Veuillez remplir les informations obligatoires.');
      }
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.tripForm.value;
    const payload: Partial<Trajet> = {
      departureCity: String(formValue.departureCity).trim(),
      arrivalCity: String(formValue.arrivalCity).trim(),
      tripDate: formValue.tripDate,
      departureTimeOfDay: formValue.departureTimeOfDay,
      arrivalTimeOfDay: formValue.arrivalTimeOfDay || null,
      busId: Number(formValue.busId),
      price: Number(formValue.price),
      driverName: formValue.driverName || null,
      seatsReserved: formValue.seatsReserved ? Number(formValue.seatsReserved) : 0,
      status: formValue.status,
      boardingPointIds: Array.isArray(formValue.boardingPointIds)
        ? formValue.boardingPointIds.map((id: any) => Number(id))
        : [Number(formValue.boardingPointIds)],
      deboardingPointIds: Array.isArray(formValue.deboardingPointIds)
        ? formValue.deboardingPointIds.map((id: any) => Number(id))
        : [Number(formValue.deboardingPointIds)],
    };

    const request$ = this.selectedTripId
      ? this.api.updateTrip(this.selectedTripId, payload)
      : this.api.createTrip(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(
          this.selectedTripId ? 'Trajet mis à jour avec succès.' : 'Trajet publié avec succès.'
        );
        this.router.navigate(['/trip-schedule']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error saving trip:', err);
        this.toast.danger(
          this.selectedTripId ? 'Impossible de mettre à jour le trajet.' : 'Impossible de publier le trajet.'
        );
      },
    });
  }
}