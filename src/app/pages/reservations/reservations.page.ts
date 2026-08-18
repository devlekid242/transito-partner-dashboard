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
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Réservations"
        subtitle="Toutes les réservations effectuées sur vos voyages"
        icon="ticket"
      >
        <button class="btn btn-secondary" (click)="refresh()">
          <app-icon name="refresh-cw" [size]="16" /> Actualiser
        </button>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des réservations...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <app-stat-card
            label="Total réservations"
            [value]="totalReservations()"
            icon="ticket"
            iconBg="bg-brand-50 text-brand-600"
          />
          <app-stat-card
            label="Confirmées"
            [value]="confirmees()"
            icon="check-circle"
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <app-stat-card
            label="En attente"
            [value]="enAttente()"
            icon="clock"
            iconBg="bg-amber-50 text-amber-600"
          />
          <app-stat-card
            label="Annulées / remboursées"
            [value]="annuleesOuRembourses()"
            icon="x-circle"
            iconBg="bg-red-50 text-red-600"
          />
        </div>

        <div class="card p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-ink-500">Revenu confirmé</p>
            <p class="text-2xl font-bold text-ink-900 mt-1">{{ formatCurrency(revenuConfirme()) }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <app-icon name="wallet" [size]="20" />
          </div>
        </div>

        <app-datatable
          [columns]="cols"
          [data]="reservations()"
          [exportable]="true"
          [filterKey]="'statut'"
          [rowActions]="actions"
        />
      }
    </div>

    @if (selectedReservation(); as r) {
      <app-modal
        title="Détail de la réservation"
        [subtitle]="r.reference"
        [isOpen]="isDetailModalOpen()"
        (close)="closeDetailModal()"
        size="md"
      >
        <div class="space-y-5">
          <!-- Statut -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-ink-500">Statut</span>
            <app-status-badge [statut]="r.statut" />
          </div>

          <!-- Passager -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">Passager</h4>
            <div class="grid grid-cols-2 gap-3 rounded-lg border border-ink-100 p-3">
              <div>
                <p class="text-xs text-ink-500">Nom</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.passager || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Téléphone</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.passengerPhone || 'N/A' }}</p>
              </div>
              @if (r.passengerEmail) {
                <div class="col-span-2">
                  <p class="text-xs text-ink-500">Email</p>
                  <p class="text-sm font-semibold text-ink-900">{{ r.passengerEmail }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Voyage -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">Voyage</h4>
            <div class="grid grid-cols-2 gap-3 rounded-lg border border-ink-100 p-3">
              <div class="col-span-2">
                <p class="text-xs text-ink-500">Trajet</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.trajet }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Date de départ</p>
                <p class="text-sm font-semibold text-ink-900">{{ formatDate(r.date) }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Place(s)</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.seatNumber || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Point d'embarquement</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.boardingPoint || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Point de débarquement</p>
                <p class="text-sm font-semibold text-ink-900">{{ r.deboardingPoint || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Billets -->
          @if (r.tickets?.length) {
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                Billets ({{ r.tickets.length }})
              </h4>
              <div class="divide-y divide-ink-100 rounded-lg border border-ink-100">
                @for (t of r.tickets; track t.id) {
                  <div class="flex items-center justify-between p-3">
                    <div>
                      <p class="text-sm font-semibold text-ink-900">{{ t.passengerName || 'N/A' }}</p>
                      <p class="text-xs text-ink-500">Place {{ t.seatNumber }} · {{ t.passengerPhone || 'N/A' }}</p>
                    </div>
                    <app-status-badge [statut]="t.status" />
                  </div>
                }
              </div>
            </div>
          }

          <!-- Montant -->
          <div class="flex items-center justify-between border-t border-ink-100 pt-4">
            <span class="text-sm font-medium text-ink-500">Montant total</span>
            <span class="text-lg font-bold text-brand-700">{{ formatCurrency(r.montant) }}</span>
          </div>

          <div class="flex justify-end pt-2">
            <button type="button" class="btn btn-secondary" (click)="closeDetailModal()">Fermer</button>
          </div>
        </div>
      </app-modal>
    }
  `,
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
}