import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { RealtimeNotificationService } from './services/realtime-notification.service';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AppComponent {
  constructor(
    private realtimeNotificationService: RealtimeNotificationService,
    private pushNotificationService: PushNotificationService,
  ) {}
}
