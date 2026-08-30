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
    CommonModule,
    RouterLink,
    IconComponent,
    StatCardComponent,
    DatatableComponent,
    PageHeaderComponent,
    ModalComponent,
  ],
  templateUrl: './trip-schedule.page.html',
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

  planifies = computed(
    () => this.trips().filter((t) => t.status === 'planifie' || t.statut === 'planifie').length,
  );
  enCours = computed(
    () => this.trips().filter((t) => t.status === 'en_cours' || t.statut === 'en_cours').length,
  );

  cols: ColumnDef[] = [
    { key: 'departureCity', label: 'Départ', sortable: true },
    { key: 'arrivalCity', label: 'Destination', sortable: true },
    { key: 'departureDate', label: 'Date', type: 'date', sortable: true },
    { key: 'departureTime', label: 'Heure de départ', sortable: true },
    { key: 'arrivalTimeOfDay', label: 'Heure d\'arrivée', sortable: true },
    { key: 'seatsReserved', label: 'Places réservées', sortable: true },
    { key: 'price', label: 'Prix', type: 'currency', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Manifeste', icon: 'ticket', action: (t: Trajet) => this.viewManifest(t) },
    { label: 'Modifier', icon: 'pencil', action: (t: Trajet) => this.editTrip(t) },
    {
      label: 'Supprimer',
      icon: 'trash',
      class: 'danger',
      action: (t: Trajet) => this.promptDelete(t),
    },
  ];

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading.set(true);
    this.api.getTrips().subscribe({
      next: (trips) => {
        this.trips.set(
          (trips as Trajet[]).map((t) => ({
            ...t,
            departureTime: new Date(t.departureTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })) ?? [],
        );
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
