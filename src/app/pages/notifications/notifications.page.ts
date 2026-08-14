import { Component, inject, computed, signal, OnInit } from "@angular/core";
import { IconComponent } from "../../shared/icon.component";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { ToastService } from "../../components/toast/toast.component";
import { PartnerApiService } from "../../services/partner-api.service";
import { NotificationItem } from "../../models";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [IconComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Notifications"
        subtitle="Restez informé de votre activité"
        icon="bell"
      >
        <button class="btn btn-secondary" (click)="markAll()" [disabled]="isLoading()">
          <app-icon name="check-check" [size]="16" /> Tout marquer lu
        </button>
      </app-page-header>
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des notifications...</span>
        </div>
      } @else {
        <div class="card divide-y divide-ink-100">
          @for (n of api.notifications(); track n.id) {
          <div
            class="flex gap-4 p-4 transition-colors hover:bg-ink-50"
            [class.bg-brand-50]="!n.lu"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              [class]="bg(n.type)"
            >
              <app-icon [name]="icon(n.type)" [size]="18" />
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-ink-900">
                    {{ n.titre }}
                  </p>
                  <p class="text-sm text-ink-500">{{ n.message }}</p>
                </div>
                @if (!n.lu) {
                  <span
                    class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                  ></span>
                }
              </div>
              <p class="mt-1 text-xs text-ink-400">{{ time(n.date) }}</p>
            </div>
            <button class="text-ink-400 hover:text-ink-600" (click)="read(n)">
              <app-icon name="check" [size]="16" />
            </button>
          </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsPage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);

  readonly isLoading = signal<boolean>(true);

  icon(t?: string) {
    return t === "success"
      ? "check-circle"
      : t === "warning"
        ? "alert-triangle"
        : t === "danger"
          ? "x-circle"
          : "info";
  }
  bg(t?: string) {
    return t === "success"
      ? "bg-brand-50 text-brand-600"
      : t === "warning"
        ? "bg-amber-50 text-amber-600"
        : t === "danger"
          ? "bg-red-50 text-red-600"
          : "bg-primary-50 text-primary-600";
  }
  time(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
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
    this.api.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.toast.success("Toutes les notifications marquées comme lues.");
      },
      error: (err) => {
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
