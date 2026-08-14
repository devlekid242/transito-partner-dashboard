import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'auth/connexion',
    loadComponent: () =>
      import('./pages/auth/connexion/connexion.page').then((m) => m.ConnexionPage),
  },
  {
    path: 'connexion',
    redirectTo: 'auth/connexion',
    pathMatch: 'full',
  },
  {
    path: 'auth/recuperation-de-compte',
    loadComponent: () =>
      import('./pages/auth/recuperation-de-compte/recuperation-de-compte.page').then(
        (m) => m.RecuperationDeComptePage,
      ),
  },
  {
    path: 'recuperation-de-compte',
    redirectTo: 'auth/recuperation-de-compte',
    pathMatch: 'full',
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('./pages/acces-refuse/acces-refuse.page').then((m) => m.AccesRefusePage),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        canActivate: [permissionGuard('dashboard')],
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'gestion-flotte',
        canActivate: [permissionGuard('gestion-flotte')],
        loadComponent: () =>
          import('./pages/gestion-flotte/gestion-flotte.page').then((m) => m.GestionFlottePage),
      },
      {
        path: 'ajout-bus',
        canActivate: [permissionGuard('gestion-flotte')],
        loadComponent: () =>
          import('./pages/ajout-bus/ajout-bus.page').then((m) => m.AjoutBusPage),
      },
      {
        path: 'ajout-bus/:id',
        canActivate: [permissionGuard('gestion-flotte')],
        loadComponent: () =>
          import('./pages/ajout-bus/ajout-bus.page').then((m) => m.AjoutBusPage),
      },
      {
        path: 'gestion-point-embarquement',
        canActivate: [permissionGuard('gestion-point-embarquement')],
        loadComponent: () =>
          import(
            './pages/gestion-point-embarquement/gestion-point-embarquement.page'
          ).then((m) => m.GestionPointEmbarquementPage),
      },
      {
        path: 'ajout-point-embarquement',
        canActivate: [permissionGuard('gestion-point-embarquement')],
        loadComponent: () =>
          import(
            './pages/ajout-point-embarquement/ajout-point-embarquement.page'
          ).then((m) => m.AjoutPointEmbarquementPage),
      },
      {
        path: 'ajout-point-embarquement/:id',
        canActivate: [permissionGuard('gestion-point-embarquement')],
        loadComponent: () =>
          import(
            './pages/ajout-point-embarquement/ajout-point-embarquement.page'
          ).then((m) => m.AjoutPointEmbarquementPage),
      },
      {
        path: 'ajout-trajet',
        canActivate: [permissionGuard('trajet')],
        loadComponent: () =>
          import('./pages/ajout-trajet/ajout-trajet.page').then((m) => m.AjoutTrajetPage),
      },
      {
        path: 'ajout-trajet/:id',
        canActivate: [permissionGuard('trajet')],
        loadComponent: () =>
          import('./pages/ajout-trajet/ajout-trajet.page').then((m) => m.AjoutTrajetPage),
      },
      {
        path: 'trajet-manifeste',
        canActivate: [permissionGuard('trajet')],
        loadComponent: () =>
          import('./pages/trajet-manifeste/trajet-manifeste.page').then(
            (m) => m.TrajetManifestePage,
          ),
      },
      {
        path: 'trajet-manifeste/:id',
        canActivate: [permissionGuard('trajet')],
        loadComponent: () =>
          import('./pages/trajet-manifeste/trajet-manifeste.page').then(
            (m) => m.TrajetManifestePage,
          ),
      },
      {
        path: 'trip-schedule',
        canActivate: [permissionGuard('trajet')],
        loadComponent: () =>
          import('./pages/trip-schedule/trip-schedule.page').then((m) => m.TripSchedulePage),
      },
      {
        path: 'demande-de-retrait',
        // canActivate: [permissionGuard('demande-de-retrait')],
        loadComponent: () =>
          import('./pages/demande-de-retrait/demande-de-retrait.page').then(
            (m) => m.DemandeDeRetraitPage,
          ),
      },
      {
        path: 'gestion-finance',
        canActivate: [permissionGuard('gestion-finance')],
        loadComponent: () =>
          import('./pages/gestion-finance/gestion-finance.page').then(
            (m) => m.GestionFinancePage,
          ),
      },
      {
        path: 'gestion-du-staff',
        canActivate: [permissionGuard('gestion-du-staff')],
        loadComponent: () =>
          import('./pages/gestion-du-staff/gestion-du-staff.page').then(
            (m) => m.GestionDuStaffPage,
          ),
      },
      {
        path: 'ajout-user',
        canActivate: [permissionGuard('gestion-du-staff')],
        loadComponent: () =>
          import('./pages/ajout-user/ajout-user.page').then((m) => m.AjoutUserPage),
      },
      {
        path: 'ajout-user/:id',
        canActivate: [permissionGuard('gestion-du-staff')],
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
        path: 'profil-agence',
        canActivate: [permissionGuard('profil-agence')],
        loadComponent: () =>
          import('./pages/profil-agence/profil-agence.page').then((m) => m.ProfilAgencePage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'rapport-analyse',
        canActivate: [permissionGuard('rapport-analyse')],
        loadComponent: () =>
          import('./pages/rapport-analyse/rapport-analyse.page').then(
            (m) => m.RapportAnalysePage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
