import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Affiche des notifications natives du navigateur (Web Notification API)
 * quand une notification temps réel arrive alors que l'onglet Transito
 * Partner n'est pas au premier plan (autre onglet actif, fenêtre minimisée,
 * autre application au premier plan).
 *
 * ⚠️ Ceci ne fonctionne QUE si l'onglet est encore ouvert quelque part (même
 * en arrière-plan). Pour recevoir des notifications navigateur complètement
 * fermé, il faut le Web Push standard (Service Worker + endpoint de
 * souscription côté backend) — une fonctionnalité distincte et plus lourde.
 */
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

  /**
   * À appeler suite à une interaction utilisateur (les navigateurs modernes
   * bloquent silencieusement la demande de permission si elle n'est pas
   * déclenchée par un geste explicite). On l'appelle juste après une
   * connexion réussie, ce qui reste un contexte de clic assez direct.
   */
  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  /**
   * Affiche une notification navigateur SEULEMENT si :
   * - la permission est accordée,
   * - ET l'onglet Transito Partner n'est pas actuellement visible/au premier
   *   plan (sinon l'utilisateur voit déjà l'évènement dans l'UI/le badge —
   *   inutile de doubler avec une notif système par-dessus).
   */
  show(title: string, options: { body?: string; tag?: string; data?: any } = {}): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }

    const notification = new Notification(title, {
      body: options.body,
      // 👈 adapte ce chemin à ton vrai logo/favicon si différent
      icon: '/assets/images/logo-notification.png',
      tag: options.tag, // même tag = remplace l'ancienne au lieu d'empiler
      data: options.data,
    });

    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/notifications']);
      notification.close();
    };
  }
}