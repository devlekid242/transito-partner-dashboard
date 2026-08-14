import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, Bus } from '../../models';

@Component({
  selector: 'app-gestion-flotte',
  standalone: true,
  imports: [
    CommonModule, RouterLink, IconComponent, StatCardComponent,
    DatatableComponent, PageHeaderComponent, ModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header title="Gestion de la Flotte" subtitle="Gérez vos bus et véhicules" icon="bus">
        <a routerLink="/ajout-bus" class="btn btn-primary">
          <app-icon name="plus" [size]="16" /> Ajouter un bus
        </a>
      </app-page-header>

      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des bus...</span>
        </div>
      } @else {
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <app-stat-card label="Total Bus" [value]="busStats().totalFleet" icon="bus" iconBg="bg-brand-50 text-brand-600" />
            <app-stat-card label="Disponibles" [value]="busStats().available" icon="check-circle" iconBg="bg-brand-50 text-brand-600" />
            <app-stat-card label="En maintenance" [value]="busStats().inMaintenance" icon="settings" iconBg="bg-amber-50 text-amber-600" />
            <app-stat-card label="Hors service" [value]="busStats().outOfService" icon="x-circle" iconBg="bg-red-50 text-red-600" />
          </div>

          <app-datatable [columns]="cols" [data]="buses()" [selectable]="true" [exportable]="true" [rowActions]="actions" />
        </div>

        <!-- Modal de détails -->
        @if (selectedBus() && isModalOpen()) {
        <app-modal 
          [isOpen]="isModalOpen()" 
          (onClose)="closeModal()"
          title="Détails du bus"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-ink-500">Immatriculation</p>
                <p class="font-medium">{{ selectedBus()?.registrationNumber || selectedBus()?.immatriculation }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Marque</p>
                <p class="font-medium">{{ selectedBus()?.brand || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Modèle</p>
                <p class="font-medium">{{ selectedBus()?.model || selectedBus()?.modele || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Catégorie</p>
                <p class="font-medium">{{ selectedBus()?.category || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Capacité</p>
                <p class="font-medium">{{ selectedBus()?.capacity || selectedBus()?.capacite }} places</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Statut</p>
                <p class="font-medium">{{ getStatusLabel(selectedBus()?.status || selectedBus()?.statut) }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Date d'ajout</p>
                <p class="font-medium">{{ selectedBus()?.acquisitionDate || selectedBus()?.dateAjout | date:'dd/MM/yyyy' }}</p>
              </div>
              <div>
                <p class="text-sm text-ink-500">Kilométrage</p>
                <p class="font-medium">{{ selectedBus()?.mileage || '—' }} km</p>
              </div>
            </div>
          </div>
        </app-modal>
        }

        <!-- Modal de confirmation de suppression -->
        @if (deletingBusId() && isDeleteModalOpen()) {
        <app-modal 
          [isOpen]="isDeleteModalOpen()" 
          (onClose)="cancelDelete()"
          title="Confirmer la suppression"
        >
          <div class="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer ce bus ? Cette action est irréversible.</p>
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
export class GestionFlottePage implements OnInit {
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // State
  readonly buses = signal<Bus[]>([]);
  readonly isLoading = signal<boolean>(true);
  
  readonly busStats = signal<{
    totalFleet: number;
    available: number;
    inMaintenance: number;
    outOfService: number;
  }>({ totalFleet: 0, available: 0, inMaintenance: 0, outOfService: 0 });
  
  // Modal states
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedBus = signal<Bus | null>(null);
  
  // Delete confirmation
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly deletingBusId = signal<number | string | null>(null);
  readonly isDeleting = signal<boolean>(false);

  cols: ColumnDef[] = [
    { key: 'registrationNumber', label: 'Immatriculation', sortable: true },
    { key: 'brand', label: 'Marque', sortable: true },
    { key: 'model', label: 'Modèle', sortable: true },
    { key: 'category', label: 'Catégorie', sortable: true },
    { key: 'capacity', label: 'Capacité', sortable: true },
    { key: 'acquisitionDate', label: "Date d'ajout", type: 'date', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: 'Voir', icon: 'eye', class: 'ghost', action: (b: Bus) => this.viewBusDetails(b) },
    { label: 'Modifier', icon: 'pencil', class: 'ghost', action: (b: Bus) => this.editBus(b) },
    { label: 'Supprimer', icon: 'trash', class: 'danger', action: (b: Bus) => this.promptDelete(b) },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadBuses();
  }

  loadBuses(): void {
    this.isLoading.set(true);
    this.api.getBuses().subscribe({
      next: (buses) => {
        this.buses.set(buses ?? []);
        this.calculateStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur de chargement des bus:', err);
        this.toast.danger('Erreur de chargement des bus');
        this.isLoading.set(false);
        this.buses.set([]);
      },
    });
  }

  calculateStats(): void {
    const buses = this.buses();
    const stats = {
      totalFleet: buses.length,
      available: buses.filter((b) => b.status === 'disponible' || b.statut === 'actif').length,
      inMaintenance: buses.filter((b) => b.status === 'maintenance' || b.statut === 'maintenance').length,
      outOfService: buses.filter((b) => b.status === 'hors_service' || b.statut === 'hors_service').length,
    };
    this.busStats.set(stats);
  }

  viewBusDetails(bus: Bus): void {
    this.selectedBus.set(bus);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedBus.set(null);
  }

  editBus(bus: Bus): void {
    this.router.navigate(['/ajout-bus', bus.id]);
  }

  promptDelete(bus: Bus): void {
    this.deletingBusId.set(bus.id);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingBusId.set(null);
  }

  confirmDelete(): void {
    const busId = this.deletingBusId();
    if (!busId) return;

    this.isDeleting.set(true);
    this.api.deleteBus(busId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteModalOpen.set(false);
        this.deletingBusId.set(null);
        this.loadBuses(); // Recharger la liste
        this.toast.success('Bus supprimé avec succès');
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error('Erreur de suppression:', err);
        this.toast.danger('Erreur lors de la suppression du bus');
      },
    });
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const labelMap: Record<string, string> = {
      disponible: 'Disponible',
      actif: 'Actif',
      maintenance: 'En maintenance',
      hors_service: 'Hors service',
    };
    return labelMap[status] || status;
  }
}
