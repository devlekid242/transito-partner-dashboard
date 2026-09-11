import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon.component';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { AlertService } from '../../services/alert.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';

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
  templateUrl: './sidebar.component.html',
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

  readonly router = inject(Router);

  readonly alertService = inject(AlertService);
  readonly realtime = inject(RealtimeNotificationService);

  // 👈 NOUVEAU : nombre à afficher sur le badge d'un NavItem donné.
  // - lien 'notifications' (la cloche) : total global non lu.
  // - tout autre lien : `section` renvoyée par le backend est stockée avec
  //   la même valeur que `item.link` (ex: 'reservations', 'gestion-finance'),
  //   donc pas de table de correspondance à maintenir ici.
  badgeFor(link: string): number {
    if (link === 'notifications') {
      return this.realtime.unreadCountSignal();
    }
    return this.realtime.unreadBySectionSignal()[link] ?? 0;
  }

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
        { label: 'Notifications', icon: 'bell' as IconName, link: 'notifications' },
        { label: 'Support utilisateur', icon: 'head-set' as IconName, link: 'support-client' },
      ],
    },
  ];

  gotoProfile() {
    this.router.navigate(['/compte-utilisateur']);
  }

  logout() {
    this.alertService.confirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
    ).then((confirmed) => {
      if (confirmed) {
        this.auth.logout();
      }
    });
  }
}