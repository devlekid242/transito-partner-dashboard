import { Injectable, effect } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PartnerApiService } from './partner-api.service';

const STORAGE_FCM_TOKEN_KEY = 'transito_partner_fcm_token';

/**
 * Enregistre le token FCM du navigateur pour recevoir les push natifs
 * (notification système, même onglet fermé/en arrière-plan), en complément
 * de RealtimeNotificationService (Pusher, temps réel "onglet ouvert").
 *
 * Volontairement, ce service n'implémente PAS de listener foreground
 * (onMessage) : quand l'onglet est ouvert et au premier plan, c'est déjà
 * Pusher qui affiche la notification via RealtimeNotificationService /
 * BrowserNotificationService. Ajouter onMessage ici créerait un doublon.
 *
 * ⚠️ Doit être injecté une fois au démarrage de l'app (même endroit que
 * RealtimeNotificationService, probablement app.component.ts) pour que
 * l'effect() ci-dessous s'exécute.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private currentToken: string | null = null;

  constructor(
    private authService: AuthService,
    private partnerApiService: PartnerApiService,
  ) {
    if (typeof localStorage !== 'undefined') {
      this.currentToken = localStorage.getItem(STORAGE_FCM_TOKEN_KEY);
    }

    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.registerForPush();
      } else {
        this.unregisterCurrentToken();
      }
    });
  }

  private async registerForPush(): Promise<void> {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      console.warn('[PushNotificationService] Push non supporté par ce navigateur.');
      return;
    }

    // La demande de permission navigateur est déjà déclenchée ailleurs
    // (RealtimeNotificationService → BrowserNotificationService au login).
    // On ne la redemande pas ici, on attend simplement qu'elle soit accordée.
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      if (!this.app) {
        this.app = initializeApp(environment.firebaseConfig);
        this.messaging = getMessaging(this.app);
      }

      const token = await getToken(this.messaging!, {
        vapidKey: environment.fcmVapidKey,
        serviceWorkerRegistration: this.swRegistration,
      });

      if (!token) {
        console.warn('[PushNotificationService] Aucun token FCM obtenu.');
        return;
      }

      if (token === this.currentToken) {
        return; // déjà enregistré côté serveur lors d'un appel précédent
      }

      this.partnerApiService.registerDeviceToken(token, 'web').subscribe({
        next: () => {
          this.currentToken = token;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_FCM_TOKEN_KEY, token);
          }
        },
        error: (err) =>
          console.error('[PushNotificationService] Échec enregistrement token FCM:', err),
      });
    } catch (err) {
      console.error('[PushNotificationService] Échec initialisation FCM:', err);
    }
  }

  private unregisterCurrentToken(): void {
    if (!this.currentToken) {
      return;
    }
    const token = this.currentToken;
    this.currentToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_FCM_TOKEN_KEY);
    }
    this.partnerApiService.unregisterDeviceToken(token).subscribe({
      error: (err) =>
        console.error('[PushNotificationService] Échec désenregistrement token FCM:', err),
    });
  }
}