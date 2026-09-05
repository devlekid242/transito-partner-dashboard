import { Injectable, signal, Component, Input, OnDestroy, inject } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { extractApiErrorMessage, extractApiMessage } from '../../utils/error.utils';

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
    setTimeout(() => this.dismiss(id), 5000);
  }

  success(responseOrMessage: unknown, fallbackMessage: string = 'Opération réussie') {
    const msg = extractApiMessage(
      responseOrMessage,
      typeof responseOrMessage === 'string' ? responseOrMessage : fallbackMessage
    );
    this.show(msg, 'success');
  }

  info(responseOrMessage: unknown, fallbackMessage: string = 'Information') {
    const msg = extractApiMessage(
      responseOrMessage,
      typeof responseOrMessage === 'string' ? responseOrMessage : fallbackMessage
    );
    this.show(msg, 'info');
  }

  warning(errorOrMessage: unknown, fallbackMessage: string = 'Attention') {
    const msg = extractApiErrorMessage(
      errorOrMessage,
      typeof errorOrMessage === 'string' ? errorOrMessage : fallbackMessage
    );
    this.show(msg, 'warning');
  }

  danger(errorOrMessage: unknown, fallbackMessage: string = 'Une erreur est survenue') {
    const msg = extractApiErrorMessage(
      errorOrMessage,
      typeof errorOrMessage === 'string' ? errorOrMessage : fallbackMessage
    );
    this.show(msg, 'danger');
  }

  error(errorOrMessage: unknown, fallbackMessage: string = 'Une erreur est survenue') {
    this.danger(errorOrMessage, fallbackMessage);
  }

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
    return t === 'success' ? 'bg-green-200 text-green-800' : t === 'warning' ? 'bg-amber-200 text-amber-800' :
      t === 'danger' ? 'bg-red-200 text-red-800' : 'bg-primary-200 text-primary-800';
  }
}
