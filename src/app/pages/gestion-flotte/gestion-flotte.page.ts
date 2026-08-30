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
  templateUrl: './gestion-flotte.page.html',
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
