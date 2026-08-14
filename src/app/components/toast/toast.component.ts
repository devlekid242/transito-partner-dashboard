import { Injectable, signal, Component, Input, OnDestroy, inject } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();
  private nextId = 0;

  show(message: string, type: Toast['type'] = 'info') {
    const id = ++this.nextId;
    this._toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }
  success(m: string) { this.show(m, 'success'); }
  info(m: string) { this.show(m, 'info'); }
  warning(m: string) { this.show(m, 'warning'); }
  danger(m: string) { this.show(m, 'danger'); }
  dismiss(id: number) {
    this._toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5">
      @for (t of toasts(); track t.id) {
        <div class="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg bg-white animate-[slideIn_0.2s_ease]"
             [class]="cls(t.type)">
          <app-icon [name]="icon(t.type)" [size]="18" />
          <p class="text-sm font-medium">{{ t.message }}</p>
          <button class="ml-2 text-ink-400 hover:text-ink-600" (click)="svc.dismiss(t.id)">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
})
export class ToastComponent {
  svc = inject(ToastService);
  toasts = this.svc.toasts;
  icon(t: string) {
    return t === 'success' ? 'check-circle' : t === 'warning' ? 'alert-triangle' :
      t === 'danger' ? 'x-circle' : 'info';
  }
  cls(t: string) {
    return t === 'success' ? 'border-brand-200' : t === 'warning' ? 'border-amber-200' :
      t === 'danger' ? 'border-red-200' : 'border-primary-200';
  }
}
