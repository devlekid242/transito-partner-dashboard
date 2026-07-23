import { Injectable, effect, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import Pusher from 'pusher-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PartnerApiService } from './partner-api.service';
import { Notification } from '../models/partner.model';

@Injectable({
  providedIn: 'root',
})
export class RealtimeNotificationService {
  private pusher?: any;
  private channel: any | null = null;
  private readonly latestNotification = signal<Notification | null>(null);
  readonly latestNotificationSignal = this.latestNotification.asReadonly();
  readonly latestNotification$ = toObservable(this.latestNotification);
  private readonly unreadCount = signal<number>(0);
  readonly unreadCountSignal = this.unreadCount.asReadonly();
  readonly unreadCount$ = toObservable(this.unreadCount);

  constructor(
    private authService: AuthService,
    private partnerApiService: PartnerApiService,
  ) {
    effect(() => {
      const user = this.authService.user();
      if (user && (!this.channel || !this.channel.subscribed)) {
        this.connectPusher();
      }
      if (!user) {
        this.disconnectPusher();
        this.unreadCount.set(0);
      }
    });

    this.refreshUnreadCount();
  }

  private getCurrentChannelName(): string | null {
    const user = this.authService.getUser();
    if (!user || user.id === undefined || user.id === null) {
      return null;
    }
    return `private-agency-${user?.agent?.agency?.id}`;
  }

  private connectPusher(): void {
    const channelName = this.getCurrentChannelName();
    if (!channelName || !environment.pusherKey) {
      return;
    }

    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      authEndpoint: environment.pusherAuthEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`,
        },
      },
      forceTLS: environment.pusherUseTLS,
    });

    this.channel = this.pusher.subscribe(channelName);
    this.channel.bind('new-notification', (payload: any) => {
      if (!payload) {
        return;
      }

      const notification: Notification = {
        id: payload.id,
        recipientType: payload.recipientType,
        recipientId: payload.recipientId,
        type: payload.type,
        category: payload.category,
        title: payload.title,
        message: payload.message,
        time: payload.createdAt,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt,
        isRead: payload.isRead,
        read: payload.isRead,
        payload: payload.payload,
      };

      this.latestNotification.set(notification);
      this.refreshUnreadCount();
    });

    this.channel.bind('pusher:subscription_succeeded', () => {
      this.refreshUnreadCount();
    });
  }

  private disconnectPusher(): void {
    if (this.channel && this.pusher) {
      this.pusher.unsubscribe(this.channel.name);
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = undefined;
    }
  }

  refreshUnreadCount(): void {
    this.partnerApiService.getUnreadNotificationCount().subscribe(
      (count) => this.unreadCount.set(count),
      () => this.unreadCount.set(0),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }
}
