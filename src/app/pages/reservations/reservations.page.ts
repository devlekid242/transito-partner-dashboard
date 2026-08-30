import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, AgencyReservation } from '../../models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    CommonModule, IconComponent, StatCardComponent, StatusBadgeComponent, DatatableComponent,
    PageHeaderComponent, ModalComponent,
  ],
  templateUrl: './reservations.page.html',
})
export class ReservationsPage implements OnInit {
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly reservations = this.api.agencyReservations;

  // KPIs calculés à partir des réservations chargées
  readonly totalReservations = computed(() => this.reservations().length);
  readonly confirmees = computed(
    () => this.reservations().filter((r) => r.statut === 'Confirmé').length,
  );
  readonly enAttente = computed(
    () => this.reservations().filter((r) => r.statut === 'En attente').length,
  );
  readonly annuleesOuRembourses = computed(
    () => this.reservations().filter((r) => r.statut === 'Annulé' || r.statut === 'Remboursé').length,
  );
  readonly revenuConfirme = computed(() =>
    this.reservations()
      .filter((r) => r.statut === 'Confirmé')
      .reduce((sum, r) => sum + (r.montant || 0), 0),
  );

  // Colonnes du tableau — types 'currency' / 'date' / 'status' déjà gérés par app-datatable
  cols: ColumnDef[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'passager', label: 'Passager', sortable: true },
    { key: 'trajet', label: 'Trajet', sortable: true },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'seatNumber', label: 'Place(s)', sortable: false },
    { key: 'montant', label: 'Montant', type: 'currency', sortable: true },
    { key: 'statut', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Voir le détail', icon: 'eye', class: 'ghost', action: (r: AgencyReservation) => this.viewReservation(r) },
  ];

  // Modal de détail
  readonly isDetailModalOpen = signal(false);
  readonly selectedReservation = signal<AgencyReservation | null>(null);

  ngOnInit(): void {
    this.loadReservations();
  }

  private loadReservations(): void {
    this.isLoading.set(true);
    this.api.getAgencyReservations().subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.toast.danger('Impossible de charger les réservations');
        this.isLoading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadReservations();
  }

  viewReservation(reservation: AgencyReservation): void {
    this.selectedReservation.set(reservation);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedReservation.set(null);
  }

  formatCurrency(v: number): string {
    return (Number(v) || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(v: string): string {
    if (!v) return 'N/A';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('fr-FR');
  }

  formatTime(v: string): string {
    if (!v) return 'N/A';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}