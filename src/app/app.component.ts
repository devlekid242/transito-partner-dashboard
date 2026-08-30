import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RealtimeNotificationService } from './services/realtime-notification.service';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor(
    private realtimeNotificationService: RealtimeNotificationService,
    private pushNotificationService: PushNotificationService,
  ) {}
}
