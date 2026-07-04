import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { Bus } from '../../models/partner.model';
import { environment } from '../../../environments/environment';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-ajout-bus',
  templateUrl: './ajout-bus.page.html',
  styleUrls: ['./ajout-bus.page.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AjoutBusPage implements OnInit {
  // Form
  busForm!: FormGroup;
  isEditMode = false;
  busId: number | null = null;
  isSubmitting = false;

  // Image preview
  previewImageUrl: string = environment.baseApiUrl + '/assets/bus-placeholder.jpg';
  selectedFile: File | null = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  // UI State
  isLoading = false;
  pageTitle = 'Ajouter un Nouveau Bus';
  pageDescription = "Saisissez les informations du véhicule pour l'enregistrer dans la flotte.";

  // Options for selects
  busCategories = [
    { value: 'Classique', label: 'Classique' },
    { value: 'VIP', label: 'VIP' },
  ];

  busStatuses = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'hors_service', label: 'Hors Service' },
  ];

  constructor(
    private fb: FormBuilder,
    private partnerApiService: PartnerApiService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if editing
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.busId = +id;
        this.isEditMode = true;
        this.pageTitle = 'Modifier le Bus';
        this.pageDescription = 'Mettez à jour les informations du véhicule.';
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
      brand: ['', [Validators.required]],
      model: ['', [Validators.required]],
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
    if (!this.busId) return;

    this.isLoading = true;
    this.partnerApiService.getBusDetails(this.busId).subscribe(
      (bus: Bus) => {
        this.busForm.patchValue({
          registrationNumber: bus.registrationNumber,
          brand: bus.brand || '',
          model: bus.model || '',
          color: bus.color || '',
          capacity: bus.capacity,
          category: bus.category,
          status: bus.status,
          acquisitionDate: bus.acquisitionDate ? bus.acquisitionDate.substring(0, 10) : '',
          mileage: bus.mileage || '',
          lastMaintenanceDate: bus.lastMaintenanceDate
            ? bus.lastMaintenanceDate.substring(0, 10)
            : '',
        });
        this.isLoading = false;
      },
      (error) => {
        console.error('Erreur de chargement du bus:', error);
        this.alertService.error('Erreur de chargement des données du bus');
        this.isLoading = false;
      },
    );
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (!this.busForm.valid) {
      this.alertService.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting = true;
    const formData = this.preparePayload(this.busForm.value);

    if (this.isEditMode && this.busId) {
      // Édition
      this.partnerApiService.updateBus(this.busId, formData).subscribe(
        (response) => {
          this.isSubmitting = false;
          this.alertService.success(`Bus ${formData.registrationNumber} modifié avec succès`);
          setTimeout(() => {
            this.router.navigate(['/gestion-flotte']);
          }, 2000);
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Erreur de modification:', error);
          this.alertService.error('Erreur lors de la modification du bus');
        },
      );
    } else {
      // Création
      this.partnerApiService.addBus(formData).subscribe(
        (response) => {
          this.isSubmitting = false;
          this.alertService.success(`Bus ${formData.registrationNumber} ajouté avec succès`);
          setTimeout(() => {
            this.router.navigate(['/gestion-flotte']);
          }, 2000);
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Erreur de création:', error);
          this.alertService.error("Erreur lors de l'ajout du bus");
        },
      );
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
   * Gère la sélection d'image
   */
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Affiche une notification toast
   */
  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  /**
   * Annule et retourne à la gestion de flotte
   */
  cancel(): void {
    this.router.navigate(['/gestion-flotte']);
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
