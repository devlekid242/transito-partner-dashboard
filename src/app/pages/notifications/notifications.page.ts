import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { NotificationItem } from '../../models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IconComponent, PageHeaderComponent],
  templateUrl: './notifications.page.html',
})
export class NotificationsPage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly isMarkingAll = signal<boolean>(false);

  icon(t?: string) {
    return t === 'success'
      ? 'check-circle'
      : t === 'warning'
        ? 'alert-triangle'
        : t === 'danger'
          ? 'x-circle'
          : 'info';
  }
  bg(t?: string) {
    return t === 'success'
      ? 'bg-brand-50 text-brand-600'
      : t === 'warning'
        ? 'bg-amber-50 text-amber-600'
        : t === 'danger'
          ? 'bg-red-50 text-red-600'
          : 'bg-primary-50 text-primary-600';
  }
  time(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
  read(n: NotificationItem) {
    this.api.markNotificationAsRead(n.id).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error marking notification as read:', err);
        this.toast.danger('Impossible de marquer cette notification comme lue');
      },
    });
  }
  markAll() {
    if (this.isMarkingAll()) return;

    this.isMarkingAll.set(true);
    this.api.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.isMarkingAll.set(false);
        this.toast.success('Toutes les notifications marquées comme lues.');
      },
      error: (err) => {
        this.isMarkingAll.set(false);
        console.error('Error marking all notifications as read:', err);
        this.toast.danger('Impossible de marquer toutes les notifications comme lues');
      },
    });
  }

  ngOnInit(): void {
    if (this.api.notifications().length === 0) {
      this.api.getNotifications().subscribe({
        next: () => this.isLoading.set(false),
        error: (err) => {
          console.error('Error loading notifications:', err);
          this.toast.danger('Impossible de charger les notifications');
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }
}
