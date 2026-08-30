import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, PointEmbarquement } from '../../models';

@Component({
  selector: 'app-gestion-point-embarquement',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, IconComponent, StatCardComponent, DatatableComponent,
    PageHeaderComponent, ModalComponent,
  ],
  templateUrl: './gestion-point-embarquement.page.html',
})
export class GestionPointEmbarquementPage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isDeleting = signal<boolean>(false);
  readonly isDeleteConfirmOpen = signal<boolean>(false);
  readonly isDetailModalOpen = signal<boolean>(false);
  readonly selectedPoint = signal<PointEmbarquement | null>(null);
  
  selectedPointId: string | null = null;
  selectedPointName = signal<string>('');

  totalPoints = computed(() => this.api.pointsEmbarquement().length);
  actifs = computed(() => this.api.pointsEmbarquement().filter((p) => p.statut === 'actif' || p.status === 'active').length);
  inactifs = computed(() => this.api.pointsEmbarquement().filter((p) => p.statut === 'inactif' || p.status === 'inactive').length);

  cols: ColumnDef[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'address', label: 'Adresse', sortable: true },
    { key: 'city', label: 'Ville', sortable: true },
    { key: 'time', label: 'Heure', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Voir', icon: 'eye', class: 'ghost', action: (p: PointEmbarquement) => this.viewPoint(p) },
    { label: 'Modifier', icon: 'pencil', class: 'ghost', action: (p: PointEmbarquement) => this.editPoint(p) },
    { label: 'Supprimer', icon: 'trash', class: 'danger', action: (p: PointEmbarquement) => this.openDeleteConfirm(p) },
  ];

  ngOnInit(): void {
    if (this.api.pointsEmbarquement().length === 0) {
      this.api.getBusPoints().subscribe({
        next: () => this.isLoading.set(false),
        error: (err) => {
          console.error('Error loading bus points:', err);
          this.toast.danger('Impossible de charger les points d\'embarquement');
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  viewPoint(point: PointEmbarquement): void {
    this.selectedPoint.set(point);
    this.isDetailModalOpen.set(true);
  }

  closePointDetails(): void {
    this.isDetailModalOpen.set(false);
    this.selectedPoint.set(null);
  }

  getStatusLabel(status?: string | null): string {
    if (!status) return 'Inconnu';
    const normalized = status.toLowerCase();
    const map: Record<string, string> = {
      actif: 'Actif',
      active: 'Actif',
      inactif: 'Inactif',
      inactive: 'Inactif',
      principal: 'Principal',
      premium: 'Premium',
      express: 'Express',
      crossborder: 'Crossborder',
    };
    return map[normalized] || status;
  }

  getBooleanLabel(value?: number | boolean | null): string {
    return value === 1 || value === true ? 'Oui' : 'Non';
  }

  getPointTypeLabel(type?: string | null): string {
    if (!type) return 'Non défini';
    return this.getStatusLabel(type);
  }

  editPoint(point: PointEmbarquement): void {
    this.router.navigate(['/ajout-point-embarquement', point.id]);
  }

  openDeleteConfirm(point: PointEmbarquement): void {
    this.selectedPointId = String(point.id);
    this.selectedPointName.set(point.nom || point.name || String(point.id));
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.selectedPointId = null;
    this.selectedPointName.set('');
  }

  confirmDelete(): void {
    if (!this.selectedPointId) return;

    this.isDeleting.set(true);
    this.api.deleteBusPoint(this.selectedPointId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Point d\'embarquement supprimé avec succès');
        this.closeDeleteConfirm();
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error('Error deleting bus point:', err);
        this.toast.danger('Impossible de supprimer le point d\'embarquement');
        this.closeDeleteConfirm();
      },
    });
  }
}
