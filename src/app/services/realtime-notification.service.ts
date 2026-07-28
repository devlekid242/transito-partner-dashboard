import { Injectable, effect, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import Pusher from 'pusher-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PartnerApiService } from './partner-api.service';
import { BrowserNotificationService } from './browser-notification.service'; // 👈 NOUVEAU
import { Notification } from '../models/partner.model';

@Injectable({
  providedIn: 'root',
})
export class RealtimeNotificationService {
  private pusher?: any;
  private channel: any | null = null;
  private agencyChannel: any | null = null;
  private connectedChannelNames = new Set<string>();

  private readonly latestNotification = signal<Notification | null>(null);
  readonly latestNotificationSignal = this.latestNotification.asReadonly();
  readonly latestNotification$ = toObservable(this.latestNotification);
  private readonly unreadCount = signal<number>(0);
  readonly unreadCountSignal = this.unreadCount.asReadonly();
  readonly unreadCount$ = toObservable(this.unreadCount);

  constructor(
    private authService: AuthService,
    private partnerApiService: PartnerApiService,
    private http: HttpClient,
    private browserNotifications: BrowserNotificationService, // 👈 NOUVEAU
  ) {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.connectPusher();
        // 👈 NOUVEAU : demande la permission de notification navigateur.
        // Sans effet si déjà accordée/refusée, ou si l'utilisateur ne
        // répond pas — c'est du "fire and forget", ça ne bloque rien.
        this.browserNotifications.requestPermission();
      } else {
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
    return `private-user-${user.id}`;
  }

  /**
   * 👈 NOUVEAU : canal de l'agence (`private-agency-{agencyId}`), sur lequel
   * le backend diffuse les notifications `agency_all` scopées (nouvelle
   * réservation, annulation client, trajet annulé/retardé, nouveau staff...).
   * Avant ce correctif, le dashboard partenaire ne recevait QUE les
   * notifications personnelles de l'agent connecté — jamais celles
   * destinées à toute l'agence.
   */
  private getCurrentAgencyChannelName(): string | null {
    const user = this.authService.getUser();
    const agencyId = user?.agent?.agency?.id;
    return agencyId ? `private-agency-${agencyId}` : null;
  }

  private connectPusher(): void {
    const channelName = this.getCurrentChannelName();
    if (!channelName || !environment.pusherKey) {
      return;
    }

    // Déjà connecté avec le bon canal personnel : on complète juste le canal
    // agence si besoin (utile si le profil agent/agency a été chargé après
    // coup) et on s'arrête là.
    if (this.pusher && this.connectedChannelNames.has(channelName)) {
      this.subscribeToAgencyChannelIfNeeded();
      return;
    }

    this.disconnectPusher();

    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      forceTLS: environment.pusherUseTLS,
      // 👈 CORRIGÉ : authorizer dynamique au lieu d'un header Authorization
      // figé à la construction. Avant, si le token JWT était rafraîchi
      // (refreshAccessToken()) puis que Pusher devait ré-authentifier un
      // canal privé (perte réseau, reconnexion), il renvoyait l'ANCIEN
      // token à /api/pusher/auth. Ici, this.authService.getToken() est
      // relu à CHAQUE tentative d'autorisation.
      authorizer: (channel: any) => ({
        authorize: (socketId: string, callback: (error: any, data: any) => void) => {
          this.http
            .post<any>(
              environment.pusherAuthEndpoint,
              { socket_id: socketId, channel_name: channel.name },
              { headers: { Authorization: `Bearer ${this.authService.getToken()}` } },
            )
            .subscribe({
              next: (response) => callback(null, response),
              error: (error) => callback(error, null),
            });
        },
      }),
    });

    this.channel = this.pusher.subscribe(channelName);
    this.connectedChannelNames.add(channelName);
    this.bindNotificationEvents(this.channel);

    this.subscribeToAgencyChannelIfNeeded();
  }

  private subscribeToAgencyChannelIfNeeded(): void {
    const agencyChannelName = this.getCurrentAgencyChannelName();
    if (!this.pusher || !agencyChannelName || this.connectedChannelNames.has(agencyChannelName)) {
      return;
    }

    this.agencyChannel = this.pusher.subscribe(agencyChannelName);
    this.connectedChannelNames.add(agencyChannelName);
    this.bindNotificationEvents(this.agencyChannel);
  }

  private bindNotificationEvents(channel: any): void {
    channel.bind('new-notification', (payload: any) => {
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

      // 👈 NOUVEAU : notification système du navigateur si l'onglet n'est
      // pas au premier plan (voir BrowserNotificationService pour le détail
      // des conditions d'affichage).
      this.browserNotifications.show(notification.title, {
        body: notification.message,
        tag: `notification-${notification.id}`,
        data: notification,
      });
    });

    channel.bind('pusher:subscription_succeeded', () => {
      this.refreshUnreadCount();
    });
  }

  private disconnectPusher(): void {
    if (this.pusher) {
      // 👈 NOUVEAU : on désabonne bien les DEUX canaux (personnel + agence),
      // pas seulement `this.channel` comme avant.
      this.connectedChannelNames.forEach((name) => this.pusher.unsubscribe(name));
      this.pusher.disconnect();
      this.pusher = undefined;
    }
    this.channel = null;
    this.agencyChannel = null;
    this.connectedChannelNames.clear();
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