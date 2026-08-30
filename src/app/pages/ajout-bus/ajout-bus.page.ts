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
  templateUrl:'./ajout-bus.page.html',
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

