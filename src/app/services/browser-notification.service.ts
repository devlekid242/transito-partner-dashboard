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
      return Notification.permission;
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  show(title: string, options: { body?: string; tag?: string; data?: any } = {}): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: '/assets/images/logo-notification.png',
      tag: options.tag,
      data: options.data,
    });

    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/notifications']);
      notification.close();
    };
  }
}
