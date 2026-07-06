import { Component, OnInit, signal, computed } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { ManifestData } from '../../models/partner.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-trajet-manifeste',
  templateUrl: './trajet-manifeste.page.html',
  styleUrls: ['./trajet-manifeste.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class TrajetManifestePage implements OnInit {
  private readonly tripInfoSignal = signal<ManifestData | null>(null);
  tripInfo = computed(() => this.tripInfoSignal());

  private readonly passengersSignal = signal<Array<any>>([]);
  passengers = computed(() => this.passengersSignal());

  passengerColumns = signal<TableColumn[]>([
    { key: 'seatNumber', title: 'Siège', sortable: true },
    { key: 'name', title: 'Passager', sortable: true },
    { key: 'ticketNumber', title: 'N° Billet' },
    { key: 'boardingStatus', title: 'Statut' },
    { key: 'boardingPoint', title: 'Point d’embarquement' },
  ]);

  passengerActions = signal<TableAction[]>([
    {
      icon: 'check',
      label: 'Valider',
      action: (item) => this.validatePassenger(item),
    },
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewPassengerDetails(item),
    },
  ]);

  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly selectedPassengerSignal = signal<any>(null);
  selectedPassenger = computed(() => this.selectedPassengerSignal());

  manifestStatusOptions = signal<{ value: string; label: string }[]>([]);
  selectedManifestStatus = signal<string>('all');

  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>('info');
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  private pendingLoadingRequests = 0;
  isLoading = signal<boolean>(false);



  tripProgress = signal<Array<{
    location: string;
    time: string;
    status: string;
    completed?: boolean;
    current?: boolean;
  }>>([]);

  constructor(
    private partnerApiService: PartnerApiService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.partnerApiService.getManifestStatusOptions().subscribe({
      next: (options) => {
        this.manifestStatusOptions.set(options);
        if (!options.some((option) => option.value === this.selectedManifestStatus())) {
          this.selectedManifestStatus.set(options[0]?.value || this.selectedManifestStatus());
        }
      },
      error: (error) => {
        console.error('Error loading manifest status options:', error);
      },
    });
    

    this.route.params.subscribe({
      next: (params) => {
        const tripId = Number(params['id'] || 1);
        this.loadManifestData(tripId);
      },
      error: (error) => {
        console.error('Error loading route params:', error);
      },
    });
  }

  filteredPassengers = computed(() => {
    if (this.selectedManifestStatus() === 'all') {
      return this.passengers();
    }
    return this.passengers().filter((passenger) => {
      if (this.selectedManifestStatus() === 'boarded') {
        return passenger.boardingStatus === 'Embarqué';
      }
      if (this.selectedManifestStatus() === 'pending') {
        return passenger.boardingStatus === 'En attente';
      }
      if (this.selectedManifestStatus() === 'cancelled') {
        return passenger.boardingStatus === 'Annulé';
      }
      return true;
    });
  });

  loadManifestData(tripId: number) {
    this.partnerApiService.getTripManifest(tripId).subscribe({
      next: (manifest: ManifestData) => {
        this.tripInfoSignal.set(manifest);
        this.passengersSignal.set(
          manifest.passengers.map((passenger) => ({
            ...passenger,
            boardingStatus: this.getStatusText(passenger.boardingStatus),
          }))
        );

        this.tripProgress.set(
          (manifest.stops ?? []).map((stop) => ({
            location: stop.location,
            time: stop.time,
            status: stop.status,
            completed: stop.completed,
            current: stop.current,
          }))
        );
      },
      error: (error) => {
        console.error('Error loading manifest:', error);
        this.showToastNotification('error', 'Erreur de chargement du manifeste');
      },
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'En attente',
      BOARDED: 'Embarqué',
      NO_SHOW: 'Non présenté',
      CANCELLED: 'Annulé',
    };
    return statusMap[status] || status;
  }

  validatePassenger(passenger: any): void {
    this.partnerApiService.validateTicket(passenger.ticketNumber).subscribe({
      next: (response) => {
        if (response.success) {
          this.passengersSignal.update((passengers) =>
            passengers.map((p) =>
              p.ticketNumber === passenger.ticketNumber ? { ...p, boardingStatus: 'Embarqué' } : p
            )
          );
          this.showToastNotification('success', `Passager ${passenger.name} validé avec succès`);
        } else {
          this.showToastNotification('error', response.message || 'Validation échouée');
        }
      },
      error: (error) => {
        console.error('Error validating ticket:', error);
        this.showToastNotification('error', 'Erreur de validation du billet');
      },
    });
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoading.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading.set(this.pendingLoadingRequests > 0);
  }

  viewPassengerDetails(passenger: any): void {
    this.selectedPassengerSignal.set(passenger);
    this.isModalOpenSignal.set(true);
  }

  printManifest(): void {
    const tripId = this.tripInfo()?.tripId;
    if (!tripId) {
      return;
    }
    this.partnerApiService.generateManifestPDF(tripId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifeste-${tripId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.showToastNotification('success', 'Manifeste téléchargé avec succès');
      },
      error: (error) => {
        console.error('Error generating PDF:', error);
        this.showToastNotification('error', 'Erreur de génération du PDF');
      },
    });
  }

  scanTicket(): void {
    this.showToastNotification('info', 'Scanner de billet activé');
  }

  selectManifestStatus(value: string | null): void {
    if (!value) {
      return;
    }
    this.selectedManifestStatus.set(value);
  }

  closeModal(): void {
    this.isModalOpenSignal.set(false);
    this.selectedPassengerSignal.set(null);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 5000);
  }
}