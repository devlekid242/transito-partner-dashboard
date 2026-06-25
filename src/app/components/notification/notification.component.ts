import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  imports: [ CommonModule ]
})
export class NotificationComponent {
  @Input() type: NotificationType = 'info';
  @Input() message: string = '';
  @Input() duration: number = 5000;
  @Input() show: boolean = false;

  ngOnInit(): void {
    if (this.show) {
      setTimeout(() => {
        this.show = false;
      }, this.duration);
    }
  }

  get typeClasses(): string {
    switch (this.type) {
      case 'success':
        return 'bg-success-green/10 text-success-green border-success-green/30';
      case 'error':
        return 'bg-danger-red/10 text-danger-red border-danger-red/30';
      case 'warning':
        return 'bg-warning-gold/10 text-tertiary-container border-warning-gold/30';
      case 'info':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  }

  get icon(): string {
    switch (this.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}