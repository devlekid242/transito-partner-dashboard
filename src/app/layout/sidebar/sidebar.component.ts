import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon.component';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

interface NavItem {
  label: string;
  icon: IconName;
  link: string;
  perm?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside
      class="flex h-full w-64 flex-col bg-ink-950 text-ink-300 transition-transform duration-300 lg:translate-x-0"
      [class.translate-x-0]="open()"
      [class.-translate-x-full]="!open()"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center gap-2.5 px-5 border-b border-white/5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <app-icon name="bus-front" [size]="20" />
        </div>
        <div>
          <p class="text-base font-bold text-white leading-none">Transito</p>
          <p class="text-[11px] text-ink-400 mt-0.5">Portail Partenaire</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        @for (section of sections; track section.title) {
          <div class="mb-5">
            <p class="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              {{ section.title }}
            </p>
            @for (item of section.items; track item.link) {
              @if (!item.perm || perms.hasPermission(item.perm)) {
                <a
                  [routerLink]="['/' + item.link]"
                  routerLinkActive="active"
                  class="nav-link group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <app-icon [name]="item.icon" [size]="18" [strokeWidth]="2" />
                  <span>{{ item.label }}</span>
                </a>
              }
            }
          </div>
        }
      </nav>

      <!-- User block -->
      <div class="border-t border-white/5 p-3">
        <div class="flex items-center gap-3 rounded-lg px-2 py-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {{ avatar() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ userName() }}</p>
            <p class="truncate text-xs text-ink-400">{{ userEmail() }}</p>
          </div>
          <button class="text-ink-400 hover:text-danger-500 transition-colors" (click)="logout()" title="Déconnexion">
            <app-icon name="logout" [size]="18" />
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: `
    :host { display: contents; }
    .nav-link { color: rgb(148 163 184); }
    .nav-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .nav-link.active {
      background: var(--color-brand-600);
      color: #fff;
      box-shadow: 0 4px 12px -2px rgba(16,185,129,0.4);
    }
    .nav-link.active app-icon { color: #fff; }
  `,
})
export class SidebarComponent {
  auth = inject(AuthService);
  perms = inject(PermissionService);
  open = input(false);

  userName = computed(() => this.auth.user()?.nom ?? 'Utilisateur');
  userEmail = computed(() => this.auth.user()?.email ?? '');
  avatar = computed(() => this.auth.user()?.avatar ?? 'U');

  sections: NavSection[] = [
    {
      title: 'Vue générale',
      items: [
        { label: 'Tableau de bord', icon: 'dashboard' as IconName, link: 'dashboard', perm: 'dashboard' },
      ],
    },
    {
      title: 'Opérations',
      items: [
        { label: 'Gestion de la Flotte', icon: 'bus' as IconName, link: 'gestion-flotte', perm: 'gestion-flotte' },
        { label: "Points d'embarquement", icon: 'map-pin' as IconName, link: 'gestion-point-embarquement', perm: 'gestion-point-embarquement' },
        { label: 'Planning des Trajets', icon: 'calendar-clock' as IconName, link: 'trip-schedule', perm: 'trajet' },
        { label: 'Reservation', icon: 'ticket' as IconName, link: 'reservations', perm: 'reservations' },
        { label: 'Gestion Financière', icon: 'wallet' as IconName, link: 'gestion-finance', perm: 'gestion-finance' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Gestion du Personnel', icon: 'users' as IconName, link: 'gestion-du-staff', perm: 'gestion-du-staff' },
        { label: 'Rapports & Analyses', icon: 'bar-chart' as IconName, link: 'rapport-analyse', perm: 'rapport-analyse' },
        { label: 'Profil Agence', icon: 'building' as IconName, link: 'profil-agence', perm: 'profil-agence' },
      ],
    },
    {
      title: 'Assistance',
      items: [
        { label: 'Support', icon: 'info' as IconName, link: 'notifications' },
        { label: 'Déconnexion', icon: 'logout' as IconName, link: 'auth/connexion' },
      ],
    },
  ];

  logout() {
    this.auth.logout();
  }
}
