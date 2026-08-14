import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, Trajet } from '../../models';

@Component({
  selector: 'app-trip-schedule',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IconComponent, StatCardComponent,
    DatatableComponent, PageHeaderComponent, ModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header title="Planning des trajets" subtitle="Planifiez et suivez tous vos départs" icon="calendar-clock">
        <a routerLink="/ajout-trajet" class="btn btn-primary">
          <app-icon name="plus" [size]="16" /> Nouveau trajet
        </a>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des trajets...</span>
        </div>
      } @else {
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <app-stat-card label="Total trajets" [value]="trips().length" icon="route" iconBg="bg-primary-50 text-primary-600" />
            <app-stat-card label="Planifiés" [value]="planifies()" icon="calendar" iconBg="bg-brand-50 text-brand-600" />
            <app-stat-card label="En cours" [value]="enCours()" icon="trending-up" iconBg="bg-amber-50 text-amber-600" />
          </div>

          <app-datatable [columns]="cols" [data]="trips()" [exportable]="true" [selectable]="true" [rowActions]="actions" />
        </div>

        @if (deletingTripId() && isDeleteModalOpen()) {
        <app-modal 
          [isOpen]="isDeleteModalOpen()" 
          (onClose)="cancelDelete()"
          title="Confirmer la suppression"
        >
          <div class="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action est irréversible.</p>
            <div class="flex justify-end gap-3">
              <button class="btn btn-secondary" (click)="cancelDelete()">Annuler</button>
              <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="isDeleting()">
                @if (isDeleting()) {
                  <span class="animate-pulse">Suppression...</span>
                } @else {
                  Supprimer
                }
              </button>
            </div>
          </div>
        </app-modal>
        }
      }
    </div>
  `,
})
export class TripSchedulePage implements OnInit {
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly trips = signal<Trajet[]>([]);
  
  // Delete confirmation
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly deletingTripId = signal<number | string | null>(null);
  readonly isDeleting = signal<boolean>(false);

  planifies = computed(() => this.trips().filter(t => t.status === 'planifie' || t.statut === 'planifie').length);
  enCours = computed(() => this.trips().filter(t => t.status === 'en_cours' || t.statut === 'en_cours').length);

  cols: ColumnDef[] = [
    { key: 'departureCity', label: 'Départ', sortable: true },
    { key: 'arrivalCity', label: 'Destination', sortable: true },
    { key: 'departureDate', label: 'Date', type: 'date', sortable: true },
    { key: 'departureTime', label: 'Heure', sortable: true },
    { key: 'seatsReserved', label: 'Places réservées', sortable: true },
    { key: 'price', label: 'Prix', type: 'currency', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Manifeste', icon: 'ticket', action: (t: Trajet) => this.viewManifest(t) },
    { label: 'Modifier', icon: 'pencil', action: (t: Trajet) => this.editTrip(t) },
    { label: 'Supprimer', icon: 'trash', class: 'danger', action: (t: Trajet) => this.promptDelete(t) },
  ];

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading.set(true);
    this.api.getTrips().subscribe({
      next: (trips) => {
        this.trips.set(trips as Trajet[] ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur de chargement des trajets:', err);
        this.toast.danger('Erreur de chargement des trajets');
        this.trips.set([]);
        this.isLoading.set(false);
      },
    });
  }

  viewManifest(trip: Trajet): void {
    this.router.navigate(['/trajet-manifeste', trip.id]);
  }

  editTrip(trip: Trajet): void {
    this.router.navigate(['/ajout-trajet', trip.id]);
  }

  promptDelete(trip: Trajet): void {
    this.deletingTripId.set(trip.id);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingTripId.set(null);
  }

  confirmDelete(): void {
    const tripId = this.deletingTripId();
    if (!tripId) return;

    this.isDeleting.set(true);
    this.api.deleteTrip(tripId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteModalOpen.set(false);
        this.deletingTripId.set(null);
        this.loadTrips();
        this.toast.success('Trajet supprimé avec succès');
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error('Erreur de suppression:', err);
        this.toast.danger('Erreur lors de la suppression du trajet');
      },
    });
  }
}
