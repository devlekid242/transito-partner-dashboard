import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {
  constructor(private router: Router) {}

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      if (Notification.permission === 'denied') {
        // Visibilité: avant, un refus passé était totalement silencieux.
        // On log pour que ce soit diagnosticable en prod sans deviner.
        console.warn(
          '[BrowserNotificationService] Permission refusée par le navigateur. ' +
          'L\'utilisateur doit la réactiver manuellement dans les réglages du site.',
        );
      }
      return Notification.permission;
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  async show(title: string, options: { body?: string; tag?: string; data?: any } = {}): Promise<void> {
    if (!this.isSupported()) {
      console.warn('[BrowserNotificationService] Notifications non supportées par ce navigateur.');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn(`[BrowserNotificationService] Permission actuelle: "${Notification.permission}", notification ignorée.`);
      return;
    }

    // Correctif: on ne bloque plus l'affichage quand l'onglet est au premier
    // plan. Avant, `visibilityState === 'visible' && hasFocus()` faisait sortir
    // la fonction en silence dès que l'utilisateur regardait l'appli, ce qui
    // masquait le bug en dev/test (onglet actif = comportement le plus courant).

    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: '/assets/images/logo-symbole-trans.png',
      tag: options.tag,
      data: options.data,
    };

    // Correctif compat mobile: Chrome Android (et d'autres navigateurs mobiles)
    // lèvent une erreur sur `new Notification(...)` et exigent de passer par
    // un Service Worker actif. On tente d'abord cette voie, avec repli sur le
    // constructeur classique pour desktop / navigateurs sans SW.
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        if (registration) {
          await registration.showNotification(title, notifOptions);
          // Le clic sur une notification via SW se gère dans le SW lui-même
          // (event 'notificationclick'), pas ici. Voir sw.ts / ngsw config.
          return;
        }
      }
      this.showViaConstructor(title, notifOptions);
    } catch (err) {
      console.error('[BrowserNotificationService] Échec de l\'affichage de la notification:', err);
      // Dernier repli si le SW existe mais plante pour une raison quelconque
      try {
        this.showViaConstructor(title, notifOptions);
      } catch {
        /* rien de plus à tenter */
      }
    }
  }

  private showViaConstructor(title: string, notifOptions: NotificationOptions): void {
    const notification = new Notification(title, notifOptions);
    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/notifications']);
      notification.close();
    };
  }
}