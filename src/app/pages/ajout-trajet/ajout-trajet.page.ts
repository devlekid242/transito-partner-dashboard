import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormComponent, FormField } from '../../components/form/form.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-ajout-trajet',
  templateUrl: './ajout-trajet.page.html',
  styleUrls: ['./ajout-trajet.page.css'],
  imports: [CommonModule, FormComponent, NotificationComponent],
})
export class AjoutTrajetPage implements OnInit {
  tripFormFields: FormField[] = [
    {
      key: 'departureCity',
      label: 'Ville de Départ',
      type: 'text',
      required: true,
      placeholder: 'Ex: Douala',
    },
    {
      key: 'arrivalCity',
      label: "Ville d'Arrivée",
      type: 'text',
      required: true,
      placeholder: 'Ex: Yaoundé',
    },
    {
      key: 'boardingPointIds',
      label: "Points d'embarquement",
      type: 'select',
      required: true,
      multiple: true,
      options: [],
    },
    {
      key: 'deboardingPointIds',
      label: 'Points de débarquement',
      type: 'select',
      required: true,
      multiple: true,
      options: [],
    },
    {
      key: 'tripDate',
      label: 'Date du Voyage',
      type: 'date',
      required: true,
      placeholder: 'YYYY-MM-DD',
    },
    {
      key: 'departureTimeOfDay',
      label: 'Heure de départ',
      type: 'time',
      required: true,
      placeholder: 'HH:MM',
    },
    {
      key: 'arrivalTimeOfDay',
      label: "Heure d'arrivée estimée",
      type: 'time',
      required: false,
      placeholder: 'HH:MM',
    },
    {
      key: 'busId',
      label: 'Bus Assigné',
      type: 'select',
      required: true,
      options: [],
    },
    {
      key: 'price',
      label: 'Prix du Billet (XAF)',
      type: 'number',
      required: true,
      placeholder: 'Ex: 5000',
      min: 0,
      step: 100,
    },
    {
      key: 'driverName',
      label: 'Nom du Chauffeur',
      type: 'text',
      required: false,
      placeholder: 'Ex: Jean Michel',
    },
    {
      key: 'seatsReserved',
      label: 'Places Réservées',
      type: 'number',
      required: false,
      placeholder: '0',
      min: 0,
      step: 1,
    },
    {
      key: 'status',
      label: 'Statut du Trajet',
      type: 'select',
      required: true,
      options: [],
    },
  ];

  selectedTripId: number | null = null;
  submitLabel = 'Créer le Trajet';
  pageTitle = 'Ajouter un Trajet';
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isSubmitting = false;

  constructor(
    private partnerApiService: PartnerApiService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedTripId = Number(idParam);
        this.pageTitle = 'Modifier le Trajet';
        this.submitLabel = 'Mettre à jour';
        this.loadTrip(this.selectedTripId);
      }
    });
  }

  loadReferenceData(): void {
    this.partnerApiService.getTripStatusOptions().subscribe((options) => {
      const statusField = this.tripFormFields.find((field) => field.key === 'status');
      if (statusField) {
        statusField.options = options;
      }
    });

    this.partnerApiService.getBuses().subscribe((buses) => {
      console.log('Fetched buses:', buses);
      const options = buses.map((b: any) => ({
        value: String(b.id),
        label: `${b.category} (${b.registrationNumber})`,
      }));
      const busField = this.tripFormFields.find((field) => field.key === 'busId');
      if (busField) {
        busField.options = options;
      }
    });

    this.partnerApiService.getBusPoints().subscribe((points) => {
      const options = points.map((point: any) => ({
        value: String(point.id),
        label: `${point.name || point.address || point.city}`,
      }));
      const boardingField = this.tripFormFields.find((field) => field.key === 'boardingPointIds');
      const deboardingField = this.tripFormFields.find(
        (field) => field.key === 'deboardingPointIds',
      );
      if (boardingField) {
        boardingField.options = options;
      }
      if (deboardingField) {
        deboardingField.options = options;
      }
    });
  }

  loadTrip(tripId: number): void {
    this.partnerApiService.getTripDetails(tripId).subscribe(
      (trip) => {
        const tripData = trip as any;
        this.tripFormFields = this.tripFormFields.map((field) => {
          const valueMap: Record<string, any> = {
            departureCity: tripData.departureCity || '',
            arrivalCity: tripData.arrivalCity || '',
            boardingPointIds: tripData.boardingPoints?.map((point: any) => String(point.id)) || [],
            deboardingPointIds:
              tripData.deboardingPoints?.map((point: any) => String(point.id)) || [],
            tripDate: tripData.tripDate || tripData.departureTime?.split('T')?.[0] || '',
            departureTimeOfDay:
              tripData.departureTimeOfDay ||
              (tripData.departureTime ? tripData.departureTime.split('T')?.[1]?.slice(0, 5) : ''),
            arrivalTimeOfDay:
              tripData.arrivalTimeOfDay ||
              (tripData.estimatedArrivalTime
                ? tripData.estimatedArrivalTime.split('T')?.[1]?.slice(0, 5)
                : ''),
            busId: tripData.bus?.id,
            price: tripData.price,
            driverName: tripData.driverName || '',
            seatsReserved: tripData.seatsReserved ?? 0,
            status: tripData.status || 'planifie',
          };
          return {
            ...field,
            value: valueMap[field.key] ?? field.value,
          };
        });
      },
      (error) => {
        console.error('Unable to load trip details', error);
        this.alertService.error('Impossible de charger le trajet.');
      },
    );
  }

  onFormSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const payload: Record<string, any> = {
      departureCity: String(formData.departureCity || '').trim(),
      arrivalCity: String(formData.arrivalCity || '').trim(),
      boardingPointIds: (Array.isArray(formData.boardingPointIds)
        ? formData.boardingPointIds
        : [formData.boardingPointIds]
      ).map((id: any) => Number(id)),
      deboardingPointIds: (Array.isArray(formData.deboardingPointIds)
        ? formData.deboardingPointIds
        : [formData.deboardingPointIds]
      ).map((id: any) => Number(id)),
      busId: Number(formData.busId),
      tripDate: formData.tripDate,
      departureTimeOfDay: formData.departureTimeOfDay,
      arrivalTimeOfDay: formData.arrivalTimeOfDay || null,
      price: Number(formData.price),
      driverName: formData.driverName || null,
      seatsReserved: formData.seatsReserved ? Number(formData.seatsReserved) : 0,
      status: formData.status,
    };

    const request$ = this.selectedTripId
      ? this.partnerApiService.updateTrip(this.selectedTripId, payload)
      : this.partnerApiService.createTrip(payload);

    request$.subscribe(
      () => {
        this.isSubmitting = false;
        this.alertService.success(this.selectedTripId ? 'Trajet mis à jour.' : 'Trajet créé.');
        this.router.navigate(['/trip-schedule']);
      },
      (error) => {
        this.isSubmitting = false;
        console.error('Error saving trip', error);
        this.alertService.error("Erreur lors de l'enregistrement du trajet.");
      },
    );
  }

  confirmDeleteTrip(): void {
    if (!this.selectedTripId || this.isSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      'Souhaitez-vous vraiment supprimer ce trajet ? Cette action est irréversible.',
    );
    if (confirmed) {
      this.deleteTrip();
    }
  }

  deleteTrip(): void {
    if (!this.selectedTripId) {
      return;
    }

    this.isSubmitting = true;
    this.partnerApiService.deleteTrip(this.selectedTripId).subscribe(
      () => {
        this.isSubmitting = false;
        this.alertService.success('Trajet supprimé avec succès.');
        this.router.navigate(['/trip-schedule']);
      },
      (error) => {
        this.isSubmitting = false;
        console.error('Erreur lors de la suppression du trajet :', error);
        this.alertService.error('Impossible de supprimer le trajet.');
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
}
