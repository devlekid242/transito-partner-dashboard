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
  templateUrl: './ajout-trajet.page.html',
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
    this.tripForm.get('departureCity')?.valueChanges.subscribe(() => this.syncSelectedPointsByCity());
    this.tripForm.get('arrivalCity')?.valueChanges.subscribe(() => this.syncSelectedPointsByCity());

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

  getFilteredBoardingPoints(): BusPoint[] {
    const departureCity = this.normalizeCityName(this.tripForm.get('departureCity')?.value);
    if (!departureCity) {
      return this.busPoints();
    }

    return this.busPoints().filter((point) => {
      const pointCity = this.normalizeCityName(point.city || point.ville);
      return pointCity === departureCity;
    });
  }

  getFilteredDeboardingPoints(): BusPoint[] {
    const arrivalCity = this.normalizeCityName(this.tripForm.get('arrivalCity')?.value);
    if (!arrivalCity) {
      return this.busPoints();
    }

    return this.busPoints().filter((point) => {
      const pointCity = this.normalizeCityName(point.city || point.ville);
      return pointCity === arrivalCity;
    });
  }

  getPointSelectSize(points: BusPoint[]): number {
    return Math.min(8, Math.max(4, points.length || 4));
  }

  private normalizeCityName(value: unknown): string {
    return String(value ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private syncSelectedPointsByCity(): void {
    const departureCity = this.tripForm.get('departureCity')?.value;
    const arrivalCity = this.tripForm.get('arrivalCity')?.value;

    const validBoarding = new Set(
      this.getFilteredBoardingPoints().map((point) => String(point.id)),
    );
    const validDeboarding = new Set(
      this.getFilteredDeboardingPoints().map((point) => String(point.id)),
    );

    const boardingSelected = Array.isArray(this.tripForm.get('boardingPointIds')?.value)
      ? this.tripForm.get('boardingPointIds')?.value.filter((id: string | number) => validBoarding.has(String(id)))
      : [];

    const deboardingSelected = Array.isArray(this.tripForm.get('deboardingPointIds')?.value)
      ? this.tripForm.get('deboardingPointIds')?.value.filter((id: string | number) => validDeboarding.has(String(id)))
      : [];

    if (
      !departureCity && !arrivalCity &&
      boardingSelected.length === (this.tripForm.get('boardingPointIds')?.value ?? []).length &&
      deboardingSelected.length === (this.tripForm.get('deboardingPointIds')?.value ?? []).length
    ) {
      return;
    }

    this.tripForm.patchValue({
      boardingPointIds: boardingSelected,
      deboardingPointIds: deboardingSelected,
    }, { emitEvent: false });
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