import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./pages/auth/connexion/connexion.page').then((m) => m.ConnexionPage),
  },
  {
    path: 'recuperation-de-compte',
    loadComponent: () =>
      import('./pages/auth/recuperation-de-compte/recuperation-de-compte.page').then(
        (m) => m.RecuperationDeComptePage,
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'ajout-bus',
        loadComponent: () => import('./pages/ajout-bus/ajout-bus.page').then((m) => m.AjoutBusPage),
      },
      {
        path: 'ajout-point-embarquement',
        loadComponent: () =>
          import('./pages/ajout-point-embarquement/ajout-point-embarquement.page').then(
            (m) => m.AjoutPointEmbarquementPage,
          ),
      },
      {
        path: 'ajout-trajet',
        loadComponent: () =>
          import('./pages/ajout-trajet/ajout-trajet.page').then((m) => m.AjoutTrajetPage),
      },
      {
        path: 'ajout-user',
        loadComponent: () =>
          import('./pages/ajout-user/ajout-user.page').then((m) => m.AjoutUserPage),
      },
      {
        path: 'compte-utilisateur',
        loadComponent: () =>
          import('./pages/compte-utilisateur/compte-utilisateur.page').then(
            (m) => m.CompteUtilisateurPage,
          ),
      },
      {
        path: 'demande-de-retrait',
        loadComponent: () =>
          import('./pages/demande-de-retrait/demande-de-retrait.page').then(
            (m) => m.DemandeDeRetraitPage,
          ),
      },
      {
        path: 'gestion-du-staff',
        loadComponent: () =>
          import('./pages/gestion-du-staff/gestion-du-staff.page').then(
            (m) => m.GestionDuStaffPage,
          ),
      },
      {
        path: 'gestion-finance',
        loadComponent: () =>
          import('./pages/gestion-finance/gestion-finance.page').then((m) => m.GestionFinancePage),
      },
      {
        path: 'gestion-flotte',
        loadComponent: () =>
          import('./pages/gestion-flotte/gestion-flotte.page').then((m) => m.GestionFlottePage),
      },
      {
        path: 'gestion-point-embarquement',
        loadComponent: () =>
          import('./pages/gestion-point-embarquement/gestion-point-embarquement.page').then(
            (m) => m.GestionPointEmbarquementPage,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'profil-agence',
        loadComponent: () =>
          import('./pages/profil-agence/profil-agence.page').then((m) => m.ProfilAgencePage),
      },
      {
        path: 'rapport-analyse',
        loadComponent: () =>
          import('./pages/rapport-analyse/rapport-analyse.page').then((m) => m.RapportAnalysePage),
      },
      {
        path: 'trajet-manifeste',
        loadComponent: () =>
          import('./pages/trajet-manifeste/trajet-manifeste.page').then(
            (m) => m.TrajetManifestePage,
          ),
      },
      {
        path: 'trip-schedule',
        loadComponent: () =>
          import('./pages/trip-schedule/trip-schedule.page').then((m) => m.TripSchedulePage),
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
