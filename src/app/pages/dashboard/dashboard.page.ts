import { Component } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { NotificationComponent } from '../../components/notification/notification.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  imports: [RevenueChartComponent, TableComponent, NotificationComponent],
})
export class DashboardPage {
  // Données pour le tableau des départs à venir
  upcomingTrips = [
    { id: 'BX-405', route: 'Yaoundé → Douala', time: '14:30', status: 'Embarquement' },
    { id: 'BX-211', route: 'Douala → Bafoussam', time: '15:00', status: 'Programmé' },
    { id: 'BX-882', route: 'Yaoundé → Bamenda', time: '16:15', status: 'Retardé' },
    { id: 'BX-109', route: 'Kribi → Douala', time: '17:00', status: 'Programmé' },
  ];

  // Colonnes du tableau
  tripColumns: TableColumn[] = [
    { key: 'id', title: 'Bus ID' },
    { key: 'route', title: 'Itinéraire' },
    { key: 'time', title: 'Heure' },
    { key: 'status', title: 'Statut' },
  ];

  // Actions du tableau
  tripActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewTripDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editTrip(item),
    },
  ];

  // Notification exemple
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = 'Nouvelle réservation reçue pour le trajet Douala-Yaoundé';

  constructor() {
    // Afficher une notification après 2 secondes (simulation)
    setTimeout(() => {
      this.showNotification = true;
    }, 2000);
  }

  viewTripDetails(trip: any): void {
    console.log('Voir détails pour:', trip);
    // Logique pour afficher les détails
  }

  editTrip(trip: any): void {
    console.log('Modifier trajet:', trip);
    // Logique pour modifier le trajet
  }

  onNotificationClosed(): void {
    this.showNotification = false;
  }

  // Metrics data
  metrics = {
    revenue: { value: '1,250,000', currency: 'XAF', change: '+12%' },
    activeTrips: { value: '12', routes: '5 itinéraires' },
    totalPassengers: { value: '345', description: "Manifestés aujourd'hui" },
  };

  // Recent activity data
  recentActivity = [
    {
      icon: 'add_circle',
      type: 'success',
      title: 'Nouvelle réservation',
      description: 'trajet Douala',
      time: 'il y a 2 mins',
    },
    {
      icon: 'account_balance_wallet',
      type: 'warning',
      title: 'Paiement demandé',
      description: '500,000 XAF',
      time: 'il y a 15 mins',
    },
    {
      icon: 'check_circle',
      type: 'success',
      title: 'Trajet TR-8902 arrivé',
      description: '',
      time: 'il y a 1 heure',
    },
    {
      icon: 'build',
      type: 'info',
      title: 'Maintenance Bus BX-102',
      description: '',
      time: 'il y a 3 heures',
    },
  ];
}
