import { Component, inject, computed, signal, OnInit } from '@angular/core';
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
    RouterLink, IconComponent, StatCardComponent, DatatableComponent,
    PageHeaderComponent, ModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header title="Points d'embarquement" subtitle="Gérez vos arrêts et points de départ" icon="map-pin">
        <a routerLink="/ajout-point-embarquement" class="btn btn-primary">
          <app-icon name="plus" [size]="16" /> Ajouter un point
        </a>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des points d'embarquement...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <app-stat-card label="Total points" [value]="totalPoints()" icon="map-pin" iconBg="bg-brand-50 text-brand-600" />
          <app-stat-card label="Actifs" [value]="actifs()" icon="check-circle" iconBg="bg-brand-50 text-brand-600" />
          <app-stat-card label="Inactifs" [value]="inactifs()" icon="x-circle" iconBg="bg-red-50 text-red-600" />
        </div>

        <app-datatable [columns]="cols" [data]="api.pointsEmbarquement()" [exportable]="true" [selectable]="true" [rowActions]="actions" />
      }
    </div>

    @if (isDeleteConfirmOpen()) {
      <app-modal
        title="Confirmer la suppression"
        [isOpen]="isDeleteConfirmOpen()"
        (close)="closeDeleteConfirm()"
        size="small"
      >
        <div class="p-1">
          <p>Êtes-vous sûr de vouloir supprimer le point <strong>{{ selectedPointName() }}</strong> ? Cette action est irréversible.</p>
          <div class="flex justify-end gap-3 border-t border-ink-100 pt-5 mt-6">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteConfirm()" [disabled]="isDeleting()">
              Annuler
            </button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="isDeleting()">
              @if (isDeleting()) {
                <span class="animate-pulse">Suppression...</span>
              } @else {
                Oui, supprimer
              }
            </button>
          </div>
        </div>
      </app-modal>
    }
  `,
})
export class GestionPointEmbarquementPage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isDeleting = signal<boolean>(false);
  readonly isDeleteConfirmOpen = signal<boolean>(false);
  
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
    const details = [
      `Nom: ${point.nom || point.name || 'N/A'}`,
      `Adresse: ${point.adresse || point.address || 'N/A'}`,
      `Ville: ${point.ville || point.city || 'N/A'}`,
      `Heure: ${point.heure || point.time || 'N/A'}`,
      `Statut: ${point.statut || point.status || 'N/A'}`,
    ].join('\n');
    this.toast.info(details);
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
