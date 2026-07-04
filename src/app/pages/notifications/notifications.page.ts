import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';
import { Notification } from '../../models/partner.model';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class NotificationsPage implements OnInit {
  // Données
  private readonly notificationsSignal = signal<Notification[]>([]);
  notifications = computed(() => this.notificationsSignal());

  // Filters
  private readonly activeFilterSignal = signal<
    'all' | 'unread' | 'operations' | 'finances' | 'system'
  >('all');
  activeFilter = computed(() => this.activeFilterSignal());

  // Modal state
  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly selectedNotificationSignal = signal<Notification | null>(null);
  selectedNotification = computed(() => this.selectedNotificationSignal());

  // Notification state
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  private readonly isLoadingSignal = signal<boolean>(false);
  isLoading = computed(() => this.isLoadingSignal());

  private readonly processingIdsSignal = signal<number[]>([]);
  processingIds = computed(() => this.processingIdsSignal());

  // Computed properties
  readonly filteredNotifications = computed(() => {
    const filter = this.activeFilterSignal();
    const notifs = this.notificationsSignal();
    if (filter === 'all') {
      return notifs;
    } else if (filter === 'unread') {
      return notifs.filter((n) => !n.isRead);
    } else {
      const categoryMap: Record<string, string> = {
        operations: 'TICKET',
        finances: 'PAYMENT',
        system: 'INFO',
      };
      return notifs.filter((n) => n.type === categoryMap[filter]);
    }
  });

  readonly unreadCount = computed(() => this.notificationsSignal().filter((n) => !n.isRead).length);

  // Colonnes du tableau
  notificationColumns: TableColumn[] = [
    { key: 'title', title: 'Title' },
    { key: 'type', title: 'Category' },
    { key: 'createdAt', title: 'Time' },
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

  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private realtimeNotificationService: RealtimeNotificationService,
    private alertService: AlertService,
  ) {
    effect(() => {
      const notification = this.realtimeNotificationService.latestNotificationSignal();
      if (notification && !this.notificationsSignal().some((n) => n.id === notification.id)) {
        this.notificationsSignal.set([notification, ...this.notificationsSignal()]);
      }
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoadingSignal.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoadingSignal.set(this.pendingLoadingRequests > 0);
  }

  loadNotifications() {
    this.beginLoading();
    this.partnerApiService
      .getNotifications()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (notifications: Notification[]) => {
          this.notificationsSignal.set(notifications);
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.alertService.error('Erreur de chargement des notifications');
        },
      });
  }

  setFilter(filter: 'all' | 'unread' | 'operations' | 'finances' | 'system'): void {
    this.activeFilterSignal.set(filter);
  }

  viewNotificationDetails(notification: Notification): void {
    this.selectedNotificationSignal.set(notification);
    this.isModalOpenSignal.set(true);

    // Mark as read when viewed
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
  }

  markAsRead(notification: Notification): void {
    this.processingIdsSignal.set([...this.processingIdsSignal(), notification.id]);
    this.partnerApiService.markNotificationAsRead(notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          notification.isRead = true;
          this.processingIdsSignal.set(
            this.processingIdsSignal().filter((id) => id !== notification.id),
          );
          this.realtimeNotificationService.refreshUnreadCount();
          this.alertService.success('Notification marquée comme lue');
        }
      },
      error: (error) => {
        this.processingIdsSignal.set(
          this.processingIdsSignal().filter((id) => id !== notification.id),
        );
        console.error('Error marking as read:', error);
        this.alertService.error('Erreur lors du marquage comme lu');
      },
    });
  }

  markAllAsRead(): void {
    this.isLoadingSignal.set(true);
    this.partnerApiService.markAllNotificationsAsRead().subscribe({
      next: (response) => {
        if (response.success) {
          const notifs = this.notificationsSignal();
          notifs.forEach((n) => (n.isRead = true));
          this.notificationsSignal.set([...notifs]);
          this.realtimeNotificationService.refreshUnreadCount();
          this.isLoadingSignal.set(false);
          this.alertService.success('Toutes les notifications ont été marquées comme lues');
        }
      },
      error: (error) => {
        this.isLoadingSignal.set(false);
        console.error('Error marking all as read:', error);
        this.alertService.error('Erreur lors du marquage de toutes les notifications');
      },
    });
  }

  closeModal(): void {
    this.isModalOpenSignal.set(false);
    this.selectedNotificationSignal.set(null);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 3000);
  }

  getNotificationCount(): number {
    const filter = this.activeFilterSignal();
    if (filter === 'all') {
      return this.notificationsSignal().length;
    } else if (filter === 'unread') {
      return this.unreadCount();
    } else {
      return this.filteredNotifications().length;
    }
  }

  getIconForCategory(category: string): string {
    switch (category) {
      case 'TICKET':
        return 'directions_car';
      case 'PAYMENT':
        return 'account_balance_wallet';
      case 'BOOKING':
        return 'book_online';
      case 'INFO':
        return 'update';
      default:
        return 'info';
    }
  }
}
