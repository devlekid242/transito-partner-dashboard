import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { AuthService } from '../../services/auth.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  auth = inject(AuthService);
  realtimeNotifications = inject(RealtimeNotificationService);
  toggleSidebar = output<void>();

  userName = computed(() => this.auth.user()?.nom ?? 'Utilisateur');
  userRole = computed(() => this.auth.user()?.role ?? '');
  avatar = computed(() => this.auth.user()?.avatar ?? 'U');

  // Avant : basé sur PartnerApiService.notifications(), qui n'était pas
  // rafraîchi par les événements Pusher -> badge figé entre deux reloads.
  // Maintenant : branché directement sur le signal temps réel, mis à jour
  // par bindNotificationEvents() dans RealtimeNotificationService.
  unreadCount = this.realtimeNotifications.unreadCountSignal;
}