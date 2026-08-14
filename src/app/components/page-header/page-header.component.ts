import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../../shared/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl:'page-header.component.html',
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() icon?: IconName;
  @Input() actions = true;
}
