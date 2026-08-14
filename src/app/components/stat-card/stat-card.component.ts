import { Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../../shared/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="card p-5 flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-ink-500">{{ label }}</p>
        <p class="mt-2 text-2xl font-bold text-ink-900">{{ value }}</p>
        @if (trend) {
          <p class="mt-2 flex items-center gap-1 text-xs font-semibold"
             [class]="trendUp ? 'text-brand-600' : 'text-danger-600'">
            <app-icon [name]="trendUp ? 'arrow-up-right' : 'arrow-down-right'" [size]="14" />
            {{ trend }}
          </p>
        }
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-xl {{ iconBg }}">
        <app-icon [name]="icon" [size]="24" [strokeWidth]="2" />
      </div>
    </div>
  `,
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input() value: string | number | null = null;
  @Input({ required: true }) icon!: IconName;
  @Input() iconBg = 'bg-brand-50 text-brand-600';
  @Input() trend?: string;
  @Input() trendUp = true;
}
