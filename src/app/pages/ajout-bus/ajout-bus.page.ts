import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { SelectOption } from '../../models';

@Component({
  selector: 'app-ajout-bus',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header [title]="pageTitle()" [subtitle]="pageDescription()" icon="bus">
        <a routerLink="/gestion-flotte" class="btn btn-secondary">
          <app-icon name="arrow-left" [size]="16" /> Retour
        </a>
      </app-page-header>

      <div class="card max-w-2xl p-6">
        <form [formGroup]="busForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label class="label" for="registrationNumber">N° Immatriculation</label>
              <input id="registrationNumber" class="input" placeholder="CI-2024-XX" formControlName="registrationNumber" />
              @if (getFieldError('registrationNumber')) {
                <p class="text-red-500 text-xs mt-1">{{ getFieldError('registrationNumber') }}</p>
              }
            </div>
            <div>
              <label class="label" for="brand">Marque</label>
              <input id="brand" class="input" placeholder="Mercedes" formControlName="brand" />
            </div>
            <div>
              <label class="label" for="model">Modèle</label>
              <input id="model" class="input" placeholder="O500" formControlName="model" />
            </div>
            <div>
              <label class="label" for="category">Catégorie</label>
              <select id="category" class="input cursor-pointer" formControlName="category">
                @for (cat of busCategories(); track cat.value) {
                  <option [value]="cat.value">{{ cat.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="capacity">Capacité (places)</label>
              <input id="capacity" type="number" class="input" placeholder="55" formControlName="capacity" />
              @if (getFieldError('capacity')) {
                <p class="text-red-500 text-xs mt-1">{{ getFieldError('capacity') }}</p>
              }
            </div>
            <div>
              <label class="label" for="status">Statut</label>
              <select id="status" class="input cursor-pointer" formControlName="status">
                @for (stat of busStatuses(); track stat.value) {
                  <option [value]="stat.value">{{ stat.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="color">Couleur</label>
              <input id="color" class="input" placeholder="Rouge" formControlName="color" />
            </div>
            <div>
              <label class="label" for="mileage">Kilométrage</label>
              <input id="mileage" type="number" class="input" placeholder="10000" formControlName="mileage" />
              @if (getFieldError('mileage')) {
                <p class="text-red-500 text-xs mt-1">{{ getFieldError('mileage') }}</p>
              }
            </div>
            <div>
              <label class="label" for="acquisitionDate">Date d'acquisition</label>
              <input id="acquisitionDate" type="date" class="input" formControlName="acquisitionDate" />
            </div>
            <div>
              <label class="label" for="lastMaintenanceDate">Dernière maintenance</label>
              <input id="lastMaintenanceDate" type="date" class="input" formControlName="lastMaintenanceDate" />
            </div>
          </div>
          <div class="flex justify-end gap-3 border-t border-ink-100 pt-5">
            <a routerLink="/gestion-flotte" class="btn btn-secondary">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting() || !busForm.valid">
              <app-icon name="save" [size]="16" /> 
              @if (!isSubmitting()) {
                Enregistrer
              } @else {
                Enregistrement...
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AjoutBusPage implements OnInit {
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Form
  busForm!: FormGroup;
  isEditMode = signal(false);
  busId = signal<number | string | null>(null);
  readonly isSubmitting = signal(false);

  // UI State
  readonly pageTitle = signal('Ajouter un Nouveau Bus');
  readonly pageDescription = signal("Saisissez les informations du véhicule pour l'enregistrer dans la flotte.");

  // Options for selects
  busCategories = signal<SelectOption[]>([
    { value: 'Classique', label: 'Classique' },
    { value: 'VIP', label: 'VIP' },
  ]);

  busStatuses = signal<SelectOption[]>([
    { value: 'disponible', label: 'Disponible' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'hors_service', label: 'Hors Service' },
  ]);

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if editing
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.busId.set(id);
        this.isEditMode.set(true);
        this.pageTitle.set('Modifier le Bus');
        this.pageDescription.set('Mettez à jour les informations du véhicule.');
        this.loadBusData();
      }
    });
  }

  /**
   * Initialise le formulaire réactif avec tous les champs
   */
  private initializeForm(): void {
    this.busForm = this.fb.group({
      registrationNumber: ['', [Validators.required]],
      brand: [''],
      model: [''],
      color: [''],
      capacity: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      category: ['Classique', [Validators.required]],
      status: ['disponible', [Validators.required]],
      acquisitionDate: [''],
      mileage: ['', [Validators.min(0)]],
      lastMaintenanceDate: [''],
    });
  }

  /**
   * Charge les données du bus pour l'édition
   */
  private loadBusData(): void {
    const busId = this.busId();
    if (!busId) return;

    this.isSubmitting.set(true);
    this.api.getBusDetails(busId).subscribe({
      next: (bus: any) => {
        this.busForm.patchValue({
          registrationNumber: bus.registrationNumber || bus.immatriculation || '',
          brand: bus.brand || '',
          model: bus.model || bus.modele || '',
          color: bus.color || '',
          capacity: bus.capacity || bus.capacite || '',
          category: bus.category || 'Classique',
          status: bus.status || bus.statut || 'disponible',
          acquisitionDate: bus.acquisitionDate ? bus.acquisitionDate.substring(0, 10) : '',
          mileage: bus.mileage || '',
          lastMaintenanceDate: bus.lastMaintenanceDate ? bus.lastMaintenanceDate.substring(0, 10) : '',
        });
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Erreur de chargement du bus:', error);
        this.toast.danger('Erreur de chargement des données du bus');
        this.isSubmitting.set(false);
      },
    });
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (!this.busForm.valid) {
      this.toast.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.preparePayload(this.busForm.value);

    const busId = this.busId();
    if (this.isEditMode() && busId) {
      // Édition
      this.api.updateBus(busId, formData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success(`Bus ${formData.registrationNumber} modifié avec succès`);
          this.router.navigate(['/gestion-flotte']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Erreur de modification:', error);
          this.toast.danger('Erreur lors de la modification du bus');
        },
      });
    } else {
      // Création
      this.api.createBus(formData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success(`Bus ${formData.registrationNumber} ajouté avec succès`);
          this.router.navigate(['/gestion-flotte']);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Erreur de création:', error);
          this.toast.danger("Erreur lors de l'ajout du bus");
        },
      });
    }
  }

  private preparePayload(payload: any): any {
    const sanitized: any = { ...payload };

    if (sanitized.acquisitionDate === '') {
      delete sanitized.acquisitionDate;
    }
    if (sanitized.lastMaintenanceDate === '') {
      delete sanitized.lastMaintenanceDate;
    }
    if (sanitized.mileage === '' || sanitized.mileage === null) {
      delete sanitized.mileage;
    }
    if (sanitized.color === '') {
      delete sanitized.color;
    }

    return sanitized;
  }

  /**
   * Obtient les erreurs d'un champ
   */
  getFieldError(fieldName: string): string | null {
    const field = this.busForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} est obligatoire`;
    }
    if (field?.hasError('min')) {
      return `${fieldName} doit être >= ${field.getError('min').min}`;
    }
    if (field?.hasError('max')) {
      return `${fieldName} doit être <= ${field.getError('max').max}`;
    }
    return null;
  }
}

