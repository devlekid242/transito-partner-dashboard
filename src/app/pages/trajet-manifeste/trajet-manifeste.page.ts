import { Component, OnInit } from '@angular/core';
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
  tripInfo: ManifestData | null = null;
  passengers: Array<any> = [];
  passengerColumns: TableColumn[] = [
    { key: 'seatNumber', title: 'Siège', sortable: true },
    { key: 'name', title: 'Passager', sortable: true },
    { key: 'ticketNumber', title: 'N° Billet' },
    { key: 'boardingStatus', title: 'Statut' },
    { key: 'boardingPoint', title: 'Point d’embarquement' },
  ];

  passengerActions: TableAction[] = [
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
  ];

  isModalOpen = false;
  selectedPassenger: any = null;

  manifestStatusOptions: { value: string; label: string }[] = [];
  selectedManifestStatus = 'all';

  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  tripProgress: Array<{
    location: string;
    time: string;
    status: string;
    completed?: boolean;
    current?: boolean;
  }> = [];

  constructor(
    private partnerApiService: PartnerApiService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.partnerApiService.getManifestStatusOptions().subscribe((options) => {
      this.manifestStatusOptions = options;
      if (!options.some((option) => option.value === this.selectedManifestStatus)) {
        this.selectedManifestStatus = options[0]?.value || this.selectedManifestStatus;
      }
    });

    this.route.params.subscribe((params) => {
      const tripId = Number(params['id'] || 1);
      this.loadManifestData(tripId);
    });
  }

  get filteredPassengers() {
    if (this.selectedManifestStatus === 'all') {
      return this.passengers;
    }
    return this.passengers.filter((passenger) => {
      if (this.selectedManifestStatus === 'boarded') {
        return passenger.boardingStatus === 'Embarqué';
      }
      if (this.selectedManifestStatus === 'pending') {
        return passenger.boardingStatus === 'En attente';
      }
      if (this.selectedManifestStatus === 'cancelled') {
        return passenger.boardingStatus === 'Annulé';
      }
      return true;
    });
  }

  loadManifestData(tripId: number) {
    this.partnerApiService.getTripManifest(tripId).subscribe(
      (manifest: ManifestData) => {
        this.tripInfo = manifest;
        this.passengers = manifest.passengers.map((passenger) => ({
          ...passenger,
          boardingStatus: this.getStatusText(passenger.boardingStatus),
        }));

        this.tripProgress = (manifest.stops ?? []).map((stop) => ({
          location: stop.location,
          time: stop.time,
          status: stop.status,
          completed: stop.completed,
          current: stop.current,
        }));
      },
      (error) => {
        console.error('Error loading manifest:', error);
        this.showToastNotification('error', 'Erreur de chargement du manifeste');
      },
    );
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
    this.partnerApiService.validateTicket(passenger.ticketNumber).subscribe(
      (response) => {
        if (response.success) {
          passenger.boardingStatus = 'Embarqué';
          this.showToastNotification('success', `Passager ${passenger.name} validé avec succès`);
        } else {
          this.showToastNotification('error', response.message || 'Validation échouée');
        }
      },
      (error) => {
        console.error('Error validating ticket:', error);
        this.showToastNotification('error', 'Erreur de validation du billet');
      },
    );
  }

  viewPassengerDetails(passenger: any): void {
    this.selectedPassenger = passenger;
    this.isModalOpen = true;
  }

  printManifest(): void {
    const tripId = this.tripInfo?.tripId;
    if (!tripId) {
      return;
    }
    this.partnerApiService.generateManifestPDF(tripId).subscribe(
      (blob: Blob) => {
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
      (error) => {
        console.error('Error generating PDF:', error);
        this.showToastNotification('error', 'Erreur de génération du PDF');
      },
    );
  }

  scanTicket(): void {
    this.showToastNotification('info', 'Scanner de billet activé');
  }

  selectManifestStatus(value: string | null): void {
    if (!value) {
      return;
    }
    this.selectedManifestStatus = value;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPassenger = null;
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
