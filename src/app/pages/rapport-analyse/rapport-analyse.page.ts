import { Component } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rapport-analyse',
  templateUrl: './rapport-analyse.page.html',
  styleUrls: ['./rapport-analyse.page.css'],
  imports: [RevenueChartComponent, TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class RapportAnalysePage {
  // Données pour le tableau d'activité récente
  recentActivity = [
    {
      id: 'TR-8492',
      route: 'Douala - Yaoundé',
      date: "Aujourd'hui, 08:30",
      status: 'Terminé',
      revenue: '125K XAF',
    },
    {
      id: 'TR-8491',
      route: 'Yaoundé - Bafoussam',
      date: "Aujourd'hui, 07:15",
      status: 'En cours',
      revenue: '85K XAF',
    },
    {
      id: 'TR-8490',
      route: 'Douala - Kribi',
      date: 'Hier, 14:00',
      status: 'Annulé',
      revenue: '0 XAF',
    },
  ];

  // Colonnes du tableau
  activityColumns: TableColumn[] = [
    { key: 'id', title: 'ID Trajet' },
    { key: 'route', title: 'Route' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Statut' },
    { key: 'revenue', title: 'Revenu' },
  ];

  // Actions du tableau
  activityActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      action: (item) => this.viewActivityDetails(item),
    },
    {
      icon: 'download',
      label: 'Export Data',
      action: (item) => this.exportActivityData(item),
    },
  ];

  // Données pour les rapports sauvegardés
  savedReports = [
    {
      id: 1,
      title: 'Bilan Mensuel Q1',
      date: '01 Mars',
      type: 'Financial',
    },
    {
      id: 2,
      title: 'Analyse Flotte Nord',
      date: '28 Fév',
      type: 'Operational',
    },
    {
      id: 3,
      title: 'Récap. Incidents',
      date: '15 Fév',
      type: 'Operational',
    },
  ];

  // Modal state
  isModalOpen = false;
  selectedActivity: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  viewActivityDetails(activity: any): void {
    this.selectedActivity = activity;
    this.isModalOpen = true;
  }

  exportActivityData(activity: any): void {
    console.log('Export data for:', activity.id);
    this.showToastNotification('success', `Data export initiated for trip ${activity.id}`);
  }

  downloadReport(report: any): void {
    console.log('Download report:', report.title);
    this.showToastNotification('info', `Downloading report: ${report.title}`);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedActivity = null;
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  // Metrics data
  metrics = {
    revenue: { value: '12.4M XAF', change: '+8.4%', period: 'vs mois précédent' },
    trips: { value: '1,248', change: '+2.1%', period: 'vs mois précédent' },
    occupancy: { value: '76%', change: '-1.5%', period: 'vs mois précédent' },
    incidents: { value: '14', change: '0%', period: 'Stable' },
  };
}
