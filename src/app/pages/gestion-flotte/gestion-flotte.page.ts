import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-flotte',
  templateUrl: './gestion-flotte.page.html',
  styleUrls: ['./gestion-flotte.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class GestionFlottePage {
  // Données pour le tableau des véhicules
  vehicles = [
    {
      id: 'LT-1024-AB',
      model: 'Volvo 9900 Coach',
      seats: 55,
      mileage: '142,500 km',
      status: 'Active',
    },
    {
      id: 'CE-8831-XY',
      model: 'Scania Touring HD',
      seats: 50,
      mileage: '89,200 km',
      status: 'Active',
    },
    {
      id: 'NW-4402-QZ',
      model: 'Mercedes Tourismo',
      seats: 60,
      mileage: '185,300 km',
      status: 'Maintenance',
    },
    {
      id: 'SW-7719-OP',
      model: 'Yutong ZK6122',
      seats: 48,
      mileage: '210,800 km',
      status: 'Active',
    },
    {
      id: 'OU-9012-CE',
      model: 'Toyota Coaster',
      seats: 30,
      mileage: '95,600 km',
      status: 'Active',
    },
  ];

  // Colonnes du tableau
  vehicleColumns: TableColumn[] = [
    { key: 'id', title: 'Plaque', sortable: true },
    { key: 'model', title: 'Modèle', sortable: true },
    { key: 'seats', title: 'Sièges' },
    { key: 'mileage', title: 'Kilométrage' },
    { key: 'status', title: 'Statut', sortable: true },
  ];

  // Actions du tableau
  vehicleActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewVehicleDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editVehicle(item),
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      action: (item) => this.deleteVehicle(item),
    },
  ];

  // Modal state
  isModalOpen = false;
  selectedVehicle: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  viewVehicleDetails(vehicle: any): void {
    this.selectedVehicle = vehicle;
    this.isModalOpen = true;
  }

  editVehicle(vehicle: any): void {
    console.log('Modifier véhicule:', vehicle);
    this.showToastNotification('info', `Modification du véhicule ${vehicle.id} en cours...`);
  }

  deleteVehicle(vehicle: any): void {
    console.log('Supprimer véhicule:', vehicle);
    this.showToastNotification('warning', `Véhicule ${vehicle.id} marqué pour suppression`);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedVehicle = null;
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  onSortChange(event: { key: string; direction: 'asc' | 'desc' }): void {
    console.log('Tri changé:', event);
    // Logique de tri à implémenter
  }
}
