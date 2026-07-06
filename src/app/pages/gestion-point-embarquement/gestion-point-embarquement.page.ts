import { Component, OnInit, signal } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { BusPoint } from '../../models/partner.model';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gestion-point-embarquement',
  templateUrl: './gestion-point-embarquement.page.html',
  styleUrls: ['./gestion-point-embarquement.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class GestionPointEmbarquementPage implements OnInit {
  // Données pour le tableau des points de vente

  salesPoints = signal<Array<BusPoint & { statusLabel?: string }>>([]);

  // Colonnes du tableau

  salesPointColumns = signal<TableColumn[]>([
    { key: 'name', title: 'Nom', sortable: true },
    { key: 'city', title: 'Ville', sortable: true },
    { key: 'quartier', title: 'Quartier' },
    { key: 'address', title: 'Adresse' },
    { key: 'phoneNumber', title: 'Téléphone' },
    { key: 'pointType', title: 'Type', sortable: true },
    { key: 'status', title: 'Statut', sortable: true },

  ]);

  // Actions du tableau

  salesPointActions = signal<TableAction[]>([
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewSalesPointDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editSalesPoint(item),
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      action: (item) => this.deleteSalesPoint(item),
    },

  ]);

  // Modal state

  isModalOpen = signal<boolean>(false);
  selectedSalesPoint = signal<BusPoint | null>(null);

  // Notification state

  showNotification = signal<boolean>(false);
  notificationType = signal<'success' | 'error' | 'warning' | 'info'>('info');
  notificationMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  deletingPointId = signal<number | null>(null);
  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.loadSalesPoints();
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;

    this.isLoading.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);

    this.isLoading.set(this.pendingLoadingRequests > 0);
  }

  loadSalesPoints() {
    this.beginLoading();
    this.partnerApiService
      .getBusPoints()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (points: BusPoint[]) => {

          this.salesPoints.set(
            points.map((point) => ({
            ...point,
            statusLabel: point.status === 'active' ? 'Actif' : 'Inactif',

            }))
          );
        },

      error: (error) => {

          console.error('Error loading sales points:', error);
          this.alertService.error('Erreur de chargement des points de vente');
      },
    });
  }

  viewSalesPointDetails(point: BusPoint): void {
    this.selectedSalesPoint.set(point);
    this.isModalOpen.set(true);
  }

  editSalesPoint(point: BusPoint): void {
    this.router.navigate(['/ajout-point-embarquement', point.id]);
  }

  addNewSalesPoint(): void {
    this.router.navigate(['/ajout-point-embarquement']);
  }

  async deleteSalesPoint(point: BusPoint): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Supprimer le point',
      `Êtes-vous sûr de vouloir supprimer ${point.name}?`,
    );
    if (!confirmed) {
      return;
    }
    this.beginLoading();
    this.deletingPointId.set(point.id);
    this.partnerApiService.deleteBusPoint(point.id)
    .pipe(finalize(() => this.finishLoading()))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.deletingPointId.set(null);
          this.salesPoints.update((points) => points.filter((p) => p.id !== point.id));
          this.alertService.success(`Point de vente ${point.name} supprimé avec succès`);
        } else {
          this.showToastNotification('error', `Erreur lors de la suppression: ${response.message}`);
        }
      },
      error: (error) => {
        this.deletingPointId.set(null);
        console.error('Error deleting sales point:', error);
        this.alertService.error('Erreur lors de la suppression du point de vente');
      },
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedSalesPoint.set(null);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {

    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotification.set(true);

    setTimeout(() => {

      this.showNotification.set(false);
    }, 5000);
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
      case 'Actif':
        return 'bg-[#e6f4ea] text-success-green border-[#cce8d6]';
      case 'inactive':
      case 'Inactif':
        return 'bg-error-container text-danger-red border-[#f5c6c6]';
      default:
        return 'bg-surface-container text-on-surface border-border-subtle';
    }
  }
}

