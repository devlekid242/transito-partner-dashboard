import { Component, OnInit } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BusPoint } from '../../models/partner.model';
import { AlertService } from '../../services/alert.service';

type AgencyPointPayload = Omit<BusPoint, 'isActive'> & {
  isActive: number;
  hasWifi?: number;
  hasAc?: number;
  hasVipLounge?: number;
  hasParking?: number;
};

@Component({
  selector: 'app-ajout-point-embarquement',
  templateUrl: './ajout-point-embarquement.page.html',
  styleUrls: ['./ajout-point-embarquement.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class AjoutPointEmbarquementPage implements OnInit {
  pointId: number | null = null;
  isEditMode = false;

  // Form fields for sales point creation
  salesPointFormFields: FormField[] = [
    {
      key: 'name',
      label: 'Nom du Point',
      type: 'text',
      required: true,
      placeholder: 'Ex: Agence Centrale Douala',
    },
    {
      key: 'city',
      label: 'Ville',
      type: 'text',
      required: true,
      placeholder: 'Ex: Douala',
    },
    {
      key: 'quartier',
      label: 'Quartier',
      type: 'text',
      required: false,
      placeholder: 'Ex: Akwa',
    },
    {
      key: 'address',
      label: 'Emplacement / Adresse',
      type: 'text',
      required: true,
      placeholder: 'Adresse complète ou repère',
    },
    {
      key: 'phoneNumber',
      label: 'Téléphone de Contact',
      type: 'tel',
      required: false,
      placeholder: '+237 XXXXXXXX',
    },
    {
      key: 'latitude',
      label: 'Latitude',
      type: 'number',
      required: false,
      placeholder: 'Ex: 4.0511',
      step: 0.000001,
    },
    {
      key: 'longitude',
      label: 'Longitude',
      type: 'number',
      required: false,
      placeholder: 'Ex: 9.7679',
      step: 0.000001,
    },
    {
      key: 'pointType',
      label: 'Type de Point',
      type: 'select',
      required: true,
      options: [],
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [],
    },
    {
      key: 'hasWifi',
      label: 'Wi-Fi disponible',
      type: 'checkbox',
      required: false,
      value: false,
    },
    {
      key: 'hasAc',
      label: 'Climatisation',
      type: 'checkbox',
      required: false,
      value: false,
    },
    {
      key: 'hasVipLounge',
      label: 'Salon VIP',
      type: 'checkbox',
      required: false,
      value: false,
    },
    {
      key: 'hasParking',
      label: 'Parking disponible',
      type: 'checkbox',
      required: false,
      value: false,
    },
  ];

  // Modal state
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  pageTitle = "Ajouter un Point d'Embarquement";
  isSubmitting = false;

  constructor(
    private partnerApiService: PartnerApiService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.partnerApiService.getPointTypes().subscribe((options) => {
      const idx = this.salesPointFormFields.findIndex((f) => f.key === 'pointType');
      if (idx !== -1) {
        this.salesPointFormFields[idx].options = options;
      }
    });

    this.partnerApiService.getAgencyPointStatusOptions().subscribe((options) => {
      const idx = this.salesPointFormFields.findIndex((f) => f.key === 'status');
      if (idx !== -1) {
        this.salesPointFormFields[idx].options = options;
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.pointId = +id;
        this.isEditMode = true;
        this.pageTitle = "Modifier le Point d'Embarquement";
        this.loadPointDetails();
      }
    });
  }

  loadPointDetails(): void {
    if (!this.pointId) {
      return;
    }

    this.partnerApiService.getBusPointDetail(this.pointId).subscribe(
      (point: BusPoint) => {
        this.salesPointFormFields = this.salesPointFormFields.map((field) => {
          const rawValue = point[field.key as keyof BusPoint];
          const value =
            field.type === 'checkbox'
              ? Boolean(rawValue)
              : field.key === 'phoneNumber'
                ? (rawValue ?? '')
                : (rawValue ?? '');
          return {
            ...field,
            value,
          };
        });
      },
      (error) => {
        console.error("Erreur de chargement du point d'embarquement:", error);
        this.alertService.error('Impossible de charger le point.');
      },
    );
  }

  onFormSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const payload: Partial<AgencyPointPayload> = {
      name: formData.name,
      city: formData.city,
      quartier: formData.quartier || undefined,
      address: formData.address,
      phoneNumber: formData.phoneNumber || undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      pointType: formData.pointType,
      status: formData.status,
      isActive: formData.status === 'active' ? 1 : 0,
      hasWifi: formData.hasWifi ? 1 : 0,
      hasAc: formData.hasAc ? 1 : 0,
      hasVipLounge: formData.hasVipLounge ? 1 : 0,
      hasParking: formData.hasParking ? 1 : 0,
    };

    if (this.isEditMode && this.pointId) {
      this.partnerApiService.updateBusPoint(this.pointId, payload).subscribe(
        () => {
          this.isSubmitting = false;
          this.alertService.success('Point mis à jour avec succès!');
          this.router.navigate(['/gestion-point-embarquement']);
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Erreur lors de la mise à jour du point:', error);
          this.alertService.error('Impossible de mettre à jour le point.');
        },
      );
    } else {
      this.partnerApiService.addBusPoint(payload).subscribe(
        () => {
          this.isSubmitting = false;
          this.alertService.success('Point ajouté avec succès!');
          this.router.navigate(['/gestion-point-embarquement']);
        },
        (error) => {
          this.isSubmitting = false;
          console.error("Erreur lors de l'ajout du point:", error);
          this.alertService.error("Impossible d'ajouter le point.");
        },
      );
    }
  }

  confirmDeletePoint(): void {
    if (!this.pointId || this.isSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce point d'embarquement ? Cette action est irréversible.",
    );
    if (confirmed) {
      this.deletePoint();
    }
  }

  deletePoint(): void {
    if (!this.pointId) {
      return;
    }

    this.isSubmitting = true;
    this.partnerApiService.deleteBusPoint(this.pointId).subscribe(
      () => {
        this.isSubmitting = false;
        this.alertService.success('Point supprimé avec succès.');
        this.router.navigate(['/gestion-point-embarquement']);
      },
      (error) => {
        this.isSubmitting = false;
        console.error('Erreur lors de la suppression du point :', error);
        this.alertService.error('Impossible de supprimer le point.');
      },
    );
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

  cancel(): void {
    this.router.navigate(['/gestion-point-embarquement']);
  }
}
