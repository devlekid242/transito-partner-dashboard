import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { Bus } from '../../models/partner.model';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

interface BusStats {
  totalFleet: number;
  available: number;
  inMaintenance: number;
  outOfService: number;
  utilizationRate: number;
}

@Component({
  selector: 'app-gestion-flotte',
  templateUrl: './gestion-flotte.page.html',
  styleUrls: ['./gestion-flotte.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class GestionFlottePage implements OnInit {
  // Véhicules (signals)
  private readonly vehiclesSignal = signal<Bus[]>([]);
  vehicles = computed(() => this.vehiclesSignal());

  private readonly vehiclesMaintenanceSignal = signal<Bus[]>([]);
  vehiclesMaintenance = computed(() => this.vehiclesMaintenanceSignal());

  // Stats
  private readonly busStatsSignal = signal<BusStats>({
    totalFleet: 0,
    available: 0,
    inMaintenance: 0,
    outOfService: 0,
    utilizationRate: 0,
  });
  busStats = computed(() => this.busStatsSignal());

  // Loading state
  private readonly isLoadingSignal = signal<boolean>(false);
  isLoading = computed(() => this.isLoadingSignal());

  private readonly deletingVehicleIdSignal = signal<number | null>(null);
  deletingVehicleId = computed(() => this.deletingVehicleIdSignal());

  // Modal state
  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly selectedVehicleSignal = signal<Bus | null>(null);
  selectedVehicle = computed(() => this.selectedVehicleSignal());

  // Maintenance
  private readonly maintenanceScheduleSignal = signal<
    Array<{
      title: string;
      vehicle: string;
      scheduledAt: string;
      description: string;
    }>
  >([]);
  maintenanceSchedule = computed(() => this.maintenanceScheduleSignal());

  // Notification state
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  // Colonnes du tableau
  vehicleColumns: TableColumn[] = [
    { key: 'registrationNumber', title: 'Plaque', sortable: true },
    { key: 'model', title: 'Modèle' },
    { key: 'capacity', title: 'Sièges' },
    { key: 'category', title: 'Catégorie', sortable: true },
    { key: 'status', title: 'Statut', sortable: true },
  ];

  // Actions du tableau
  vehicleActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewVehicleDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editVehicle(item),
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      action: (item) => this.deleteVehicle(item),
    },
  ];

  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
    private alertService: AlertService,
  ) {
    effect(() => {
      this.isLoading();
    });
  }

  ngOnInit() {
    this.loadvehiclesMaintenance();
    this.loadVehicles();
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoadingSignal.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoadingSignal.set(this.pendingLoadingRequests > 0);
  }

  loadvehiclesMaintenance() {
    this.beginLoading();
    this.partnerApiService
      .getMaintenanceSchedule()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (buses: Bus[]) => {
          this.vehiclesMaintenanceSignal.set(buses);
          this.buildMaintenanceSchedule();
          console.log('Véhicules chargés:', this.vehiclesMaintenanceSignal());
        },
        error: (error) => {
          console.error('Erreur de chargement des véhicules:', error);
          this.showToastNotification('error', 'Erreur de chargement des véhicules');
        },
      });
  }

  loadVehicles() {
    this.beginLoading();
    this.partnerApiService
      .getBuses()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (buses: any) => {
          this.vehiclesSignal.set(buses ?? []);
          this.calculateStats();
          console.log('Véhicules chargés:', this.vehiclesSignal());
        },
        error: (error) => {
          console.error('Erreur de chargement des véhicules:', error);
          this.showToastNotification('error', 'Erreur de chargement des véhicules');
        },
      });
  }

  private buildMaintenanceSchedule(): void {
    const schedule = this.vehiclesMaintenanceSignal()
      .filter((bus) => bus.status === 'maintenance' || bus.lastMaintenanceDate)
      .map((bus) => ({
        title: bus.status === 'maintenance' ? 'Entretien planifié' : 'Dernière maintenance',
        vehicle: bus.registrationNumber,
        scheduledAt: bus.lastMaintenanceDate
          ? bus.lastMaintenanceDate.substring(0, 10)
          : bus.acquisitionDate
            ? bus.acquisitionDate.substring(0, 10)
            : 'Date inconnue',
        description:
          bus.brand && bus.model ? `${bus.brand} ${bus.model}` : `Bus ${bus.registrationNumber}`,
      }))
      .slice(0, 5);
    this.maintenanceScheduleSignal.set(schedule);
  }

  /**
   * Calcule les stats dynamiquement à partir des véhicules chargés
   */
  calculateStats(): void {
    const vehicles = this.vehiclesSignal();
    const stats: BusStats = {
      totalFleet: vehicles.length,
      available: vehicles.filter((v) => v.status === 'disponible').length,
      inMaintenance: vehicles.filter((v) => v.status === 'maintenance').length,
      outOfService: vehicles.filter((v) => v.status === 'hors_service').length,
      utilizationRate: 0,
    };

    // Taux d'utilisation: (véhicules disponibles / total) * 100
    stats.utilizationRate =
      stats.totalFleet > 0 ? Math.round((stats.available / stats.totalFleet) * 100) : 0;
    this.busStatsSignal.set(stats);
  }

  /**
   * Affiche les détails du véhicule dans une modal
   */
  viewVehicleDetails(vehicle: Bus): void {
    this.selectedVehicleSignal.set(vehicle);
    this.isModalOpenSignal.set(true);
  }

  /**
   * Navigue vers la page d'édition du véhicule
   */
  editVehicle(vehicle: Bus | null): void {
    if (vehicle) {
      this.router.navigate(['/ajout-bus', vehicle.id]);
    }
  }

  /**
   * Supprime un véhicule après confirmation
   */
  async deleteVehicle(vehicle: Bus | null): Promise<void> {
    if (!vehicle) {
      return;
    }

    const confirmed = await this.alertService.confirm(
      'Supprimer le véhicule',
      `Êtes-vous sûr de vouloir supprimer le véhicule ${vehicle.registrationNumber}?`,
    );
    if (!confirmed) {
      return;
    }

    this.deletingVehicleIdSignal.set(vehicle.id);
    this.partnerApiService.deleteBus(vehicle.id).subscribe({
      next: (response) => {
        this.deletingVehicleIdSignal.set(null);
        const updated = this.vehiclesSignal().filter((v) => v.id !== vehicle.id);
        this.vehiclesSignal.set(updated);
        this.calculateStats();
        this.alertService.success(`Véhicule ${vehicle.registrationNumber} supprimé avec succès`);
      },
      error: (error) => {
        this.deletingVehicleIdSignal.set(null);
        console.error('Erreur de suppression:', error);
        this.alertService.error('Erreur lors de la suppression du véhicule');
      },
    });
  }

  /**
   * Ferme la modal des détails
   */
  closeModal(): void {
    this.isModalOpenSignal.set(false);
    this.selectedVehicleSignal.set(null);
  }

  /**
   * Affiche une notification toast
   */
  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    // Auto-hide après 5 secondes
    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 5000);
  }

  /**
   * Navigue vers la page d'ajout de bus
   */
  navigateToAddBus(): void {
    this.router.navigate(['/ajout-bus']);
  }

  /**
   * Gère le tri du tableau
   */
  onSortChange(event: any): void {
    console.log('Tri:', event);
  }
}
