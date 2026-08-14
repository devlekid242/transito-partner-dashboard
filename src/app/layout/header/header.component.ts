import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { AuthService } from '../../services/auth.service';
import { PartnerApiService } from '../../services/partner-api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white px-4 lg:px-6">
      <!-- Mobile toggle -->
      <button class="btn btn-ghost !px-2 lg:hidden" (click)="toggleSidebar.emit()">
        <app-icon name="menu" [size]="22" />
      </button>

      <!-- Title -->
      <div class="hidden sm:block">
        <p class="text-sm font-bold text-ink-900">Transito Partner</p>
        <p class="text-[11px] text-ink-500">Portail de gestion</p>
      </div>

      <!-- Search -->
      <div class="relative ml-auto hidden max-w-md flex-1 md:block">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <app-icon name="search" [size]="16" />
        </span>
        <input type="text" class="input pl-9" placeholder="Rechercher un trajet, bus, passager..." />
      </div>

      <!-- Actions -->
      <div class="ml-auto flex items-center gap-1 md:ml-3">
        <!-- Notifications -->
        <a routerLink="/notifications" class="relative btn btn-ghost !px-2.5" title="Notifications">
          <app-icon name="bell" [size]="20" />
          @if (unreadCount() > 0) {
            <span class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
              {{ unreadCount() }}
            </span>
          }
        </a>

        <!-- Profile -->
        <a routerLink="/compte-utilisateur" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50 transition-colors">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {{ avatar() }}
          </div>
          <div class="hidden sm:block">
            <p class="text-sm font-semibold text-ink-900 leading-none">{{ userName() }}</p>
            <p class="text-xs text-ink-500 mt-0.5 capitalize">{{ userRole() }}</p>
          </div>
        </a>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  api = inject(PartnerApiService);
  toggleSidebar = output<void>();

  userName = computed(() => this.auth.user()?.nom ?? 'Utilisateur');
  userRole = computed(() => this.auth.user()?.role ?? '');
  avatar = computed(() => this.auth.user()?.avatar ?? 'U');
  unreadCount = computed(() => this.api.notifications().filter((n) => !n.lu).length);
}
