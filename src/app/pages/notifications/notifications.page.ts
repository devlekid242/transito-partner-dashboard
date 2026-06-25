import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class NotificationsPage {
  // Données pour le tableau des notifications
  notifications = [
    {
      id: 1,
      type: 'Critical',
      category: 'Trip',
      title: 'Retard important signalé - Trajet TR-8492',
      message:
        'Le chauffeur du véhicule V-102 a signalé un retard estimé de 45 minutes suite à un incident sur la route nationale N4.',
      time: 'Il y a 10 min',
      read: false,
    },
    {
      id: 2,
      type: 'Warning',
      category: 'Payment',
      title: 'Échec du règlement partenaire - Période S42',
      message:
        'Le virement automatique de 1,450K XAF a échoué. Veuillez vérifier les informations de votre compte bancaire enregistré.',
      time: 'Il y a 1 h',
      read: false,
    },
    {
      id: 3,
      type: 'Info',
      category: 'Booking',
      title: 'Nouvelle réservation de groupe confirmée',
      message:
        'Une réservation pour 12 passagers a été confirmée pour le trajet Douala - Yaoundé du 24 Nov.',
      time: 'Il y a 3 h',
      read: false,
    },
    {
      id: 4,
      type: 'Success',
      category: 'Trip',
      title: 'Trajet TR-8490 terminé',
      message:
        'Le trajet TR-8490 est arrivé à destination sans incident. Le manifeste de voyage a été clôturé.',
      time: 'Hier, 14:30',
      read: true,
    },
    {
      id: 5,
      type: 'Info',
      category: 'System',
      title: "Mise à jour de l'application partenaire",
      message:
        "La version 2.4 de l'application mobile est disponible avec de nouvelles fonctionnalités.",
      time: 'Hier, 09:00',
      read: true,
    },
  ];

  // Colonnes du tableau
  notificationColumns: TableColumn[] = [
    { key: 'title', title: 'Title' },
    { key: 'category', title: 'Category' },
    { key: 'time', title: 'Time' },
  ];

  // Actions du tableau
  notificationActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      action: (item) => this.viewNotificationDetails(item),
    },
    {
      icon: 'check',
      label: 'Mark as Read',
      action: (item) => this.markAsRead(item),
    },
  ];

  // Filters
  activeFilter: 'all' | 'unread' | 'operations' | 'finances' | 'system' = 'all';

  // Modal state
  isModalOpen = false;
  selectedNotification: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  get filteredNotifications() {
    if (this.activeFilter === 'all') {
      return this.notifications;
    } else if (this.activeFilter === 'unread') {
      return this.notifications.filter((n) => !n.read);
    } else {
      // Filter by category
      const categoryMap: Record<string, string> = {
        operations: 'Trip',
        finances: 'Payment',
        system: 'System',
      };
      return this.notifications.filter((n) => n.category === categoryMap[this.activeFilter]);
    }
  }

  get unreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  setFilter(filter: 'all' | 'unread' | 'operations' | 'finances' | 'system'): void {
    this.activeFilter = filter;
  }

  viewNotificationDetails(notification: any): void {
    this.selectedNotification = notification;
    this.isModalOpen = true;

    // Mark as read when viewed
    if (!notification.read) {
      this.markAsRead(notification);
    }
  }

  markAsRead(notification: any): void {
    notification.read = true;
    this.showToastNotification('success', 'Notification marked as read');
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.showToastNotification('success', 'All notifications marked as read');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedNotification = null;
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 3000);
  }

  getNotificationCount(): number {
    if (this.activeFilter === 'all') {
      return this.notifications.length;
    } else if (this.activeFilter === 'unread') {
      return this.unreadCount;
    } else {
      return this.filteredNotifications.length;
    }
  }
  
  getIconForCategory(category: string): string {
    switch(category) {
      case 'Trip': return 'directions_car';
      case 'Payment': return 'account_balance_wallet';
      case 'Booking': return 'book_online';
      case 'System': return 'update';
      default: return 'info';
    }
  }
}
