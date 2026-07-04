import { Component, OnInit } from '@angular/core';
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
  salesPoints: Array<BusPoint & { statusLabel?: string }> = [];

  // Colonnes du tableau
  salesPointColumns: TableColumn[] = [
    { key: 'name', title: 'Nom', sortable: true },
    { key: 'city', title: 'Ville', sortable: true },
    { key: 'quartier', title: 'Quartier' },
    { key: 'address', title: 'Adresse' },
    { key: 'phoneNumber', title: 'Téléphone' },
    { key: 'pointType', title: 'Type', sortable: true },
    { key: 'status', title: 'Statut', sortable: true },
  ];

  // Actions du tableau
  salesPointActions: TableAction[] = [
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
  ];

  // Modal state
  isModalOpen = false;
  selectedSalesPoint: BusPoint | null = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isLoading = false;
  deletingPointId: number | null = null;
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
    this.isLoading = true;
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading = this.pendingLoadingRequests > 0;
  }

  loadSalesPoints() {
    this.beginLoading();
    this.partnerApiService
      .getBusPoints()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (points: BusPoint[]) => {
          this.salesPoints = points.map((point) => ({
            ...point,
            statusLabel: point.status === 'active' ? 'Actif' : 'Inactif',
          }));
        },
        (error) => {
          console.error('Error loading sales points:', error);
          this.alertService.error('Erreur de chargement des points de vente');
        },
      );
  }

  viewSalesPointDetails(point: BusPoint): void {
    this.selectedSalesPoint = point;
    this.isModalOpen = true;
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

    this.deletingPointId = point.id;
    this.partnerApiService.deleteBusPoint(point.id).subscribe(
      (response) => {
        if (response.success) {
          this.deletingPointId = null;
          this.salesPoints = this.salesPoints.filter((p) => p.id !== point.id);
          this.alertService.success(`Point de vente ${point.name} supprimé avec succès`);
        } else {
          this.showToastNotification('error', `Erreur lors de la suppression: ${response.message}`);
        }
      },
      (error) => {
        this.deletingPointId = null;
        console.error('Error deleting sales point:', error);
        this.alertService.error('Erreur lors de la suppression du point de vente');
      },
    );
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSalesPoint = null;
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
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
