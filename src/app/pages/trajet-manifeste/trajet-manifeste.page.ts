import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, ManifestData, Passenger } from '../../models';

@Component({
  selector: 'app-trajet-manifeste',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, DatatableComponent, PageHeaderComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <app-page-header title="Manifeste du trajet" subtitle="Liste des passagers enregistrés" icon="ticket">
        <a routerLink="/trip-schedule" class="btn btn-secondary">
          <app-icon name="arrow-left" [size]="16" /> Planning
        </a>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement du manifeste...</span>
        </div>
      } @else if (tripInfo()) {
        <div class="space-y-4">
          <!-- Trip Header -->
          <div class="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <app-icon name="route" [size]="24" />
              </div>
              <div>
                <p class="font-bold text-ink-900">{{ tripInfo()?.departureCity || '—' }} → {{ tripInfo()?.arrivalCity || '—' }}</p>
                <p class="text-sm text-ink-500">{{ formatDateTime(tripInfo()?.departureTime) }} · {{ tripInfo()?.busInfo?.licensePlate || tripInfo()?.busRegistrationNumber || '—' }}</p>
              </div>
            </div>
            <div class="flex gap-6">
              <div>
                <p class="text-xl font-bold text-ink-900">{{ tripInfo()?.seatsReserved || 0 }} / {{ tripInfo()?.busCapacity || 0 }}</p>
                <p class="text-xs text-ink-500">Passagers</p>
              </div>
              <div>
                <p class="text-xl font-bold text-brand-600">{{ tripInfo()?.totalRevenue | number }} FCFA</p>
                <p class="text-xs text-ink-500">Revenus</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="card p-5">
              <h3 class="mb-3 flex items-center gap-2 font-semibold text-ink-900">
                <app-icon name="map-pin" [size]="18" /> Points d'embarquement
              </h3>
              <div class="space-y-3">
                @for (point of tripInfo()?.boardingPoints || []; track point.id || point.name) {
                  <div class="border-b border-ink-100 pb-2 last:border-0 last:pb-0">
                    <p class="font-medium text-ink-800">{{ point.name }}</p>
                    <p class="text-sm text-ink-500">{{ point.address || 'Adresse non renseignée' }} · {{ point.city || tripInfo()?.departureCity }}</p>
                  </div>
                } @empty {
                  <p class="text-sm text-ink-500">Aucun point d'embarquement renseigné.</p>
                }
              </div>
            </div>
            <div class="card p-5">
              <h3 class="mb-3 flex items-center gap-2 font-semibold text-ink-900">
                <app-icon name="map-pin" [size]="18" /> Points de débarquement
              </h3>
              <div class="space-y-3">
                @for (point of tripInfo()?.deboardingPoints || []; track point.id || point.name) {
                  <div class="border-b border-ink-100 pb-2 last:border-0 last:pb-0">
                    <p class="font-medium text-ink-800">{{ point.name }}</p>
                    <p class="text-sm text-ink-500">{{ point.address || 'Adresse non renseignée' }} · {{ point.city || tripInfo()?.arrivalCity }}</p>
                  </div>
                } @empty {
                  <p class="text-sm text-ink-500">Aucun point de débarquement renseigné.</p>
                }
              </div>
            </div>
          </div>

          <!-- Passengers Table -->
          <app-datatable 
            [columns]="cols" 
            [data]="passengers()" 
            [exportable]="true" 
            [selectable]="true" 
            [rowActions]="actions" 
          />
        </div>

        <!-- Passenger Details Modal -->
        @if (selectedPassenger() && isModalOpen()) {
        <app-modal 
          [isOpen]="isModalOpen()" 
          (close)="closeModal()"
          title="Détails du passager"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-ink-500">Nom</p>
                <p class="font-medium">{{ selectedPassenger()?.name || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">N° Billet</p>
                <p class="font-medium">{{ selectedPassenger()?.ticketNumber || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Statut</p>
                <p class="font-medium">{{ getStatusText(selectedPassenger()?.boardingStatus) }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Point d'embarquement</p>
                <p class="font-medium">{{ selectedPassenger()?.boardingPoint || '—' }}</p>
              </div>
            </div>
          </div>
        </app-modal>
        }
      }
    </div>
  `,
})
export class TrajetManifestePage implements OnInit {
  private api = inject(PartnerApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // State
  readonly tripInfo = signal<ManifestData | null>(null);
  readonly passengers = signal<Passenger[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedPassenger = signal<Passenger | null>(null);

  cols: ColumnDef[] = [
    { key: 'ticketNumber', label: 'Billet', sortable: true },
    { key: 'name', label: 'Passager', sortable: true },
    { key: 'seatNumber', label: 'Siège', sortable: true },
    { key: 'boardingPoint', label: 'Embarquement', sortable: true },
    { key: 'deboardingPoint', label: 'Débarquement', sortable: true },
    { key: 'price', label: 'Prix', type: 'currency', sortable: true },
    { key: 'boardingStatus', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Voir', icon: 'eye', action: (item: any) => this.viewPassengerDetails(item) },
    { label: 'Valider', icon: 'check', action: (item: any) => this.validatePassenger(item) },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = params.get('id');
      if (tripId) {
        this.loadManifestData(Number(tripId));
      }
    });
  }

  loadManifestData(tripId: number): void {
    this.isLoading.set(true);
    this.api.getTripManifest(tripId).subscribe({
      next: (manifest: any) => {
        this.tripInfo.set(manifest);
        this.passengers.set(manifest.passengers || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading manifest:', error);
        this.toast.danger(error, 'Impossible de charger le manifeste du trajet');
        this.isLoading.set(false);
      },
    });
  }

  viewPassengerDetails(passenger: any): void {
    this.selectedPassenger.set(passenger);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedPassenger.set(null);
  }

  validatePassenger(passenger: any): void {
    if (!passenger.ticketNumber) return;
    
    this.api.validateTicket(passenger.ticketNumber).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.passengers.update((passengers) =>
            passengers.map((p) =>
              p.ticketNumber === passenger.ticketNumber ? { ...p, boardingStatus: 'BOARDED' } : p
            )
          );
          this.toast.success(response, `Passager ${passenger.name} validé avec succès`);
        } else {
          this.toast.danger(response, 'Validation échouée');
        }
      },
      error: (error) => {
        console.error('Error validating ticket:', error);
        this.toast.danger(error, 'Erreur de validation du billet');
      },
    });
  }

  getStatusText(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const statusMap: Record<string, string> = {
      PENDING: 'En attente',
      BOARDED: 'Embarqué',
      NO_SHOW: 'Non présenté',
      CANCELLED: 'Annulé',
    };
    return statusMap[status] || status;
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
