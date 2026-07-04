import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

// Synchronisé avec Agent.agentRole de la BDD
export enum PartnerRole {
  ADMIN_AGENCE = 'admin_agence', // Admin de l'agence - accès complet
  AGENT_QUAI = 'agent_quai', // Agent de quai - accès limité
}

export interface PartnerPermissions {
  canViewDashboard: boolean;
  canAddBus: boolean;
  canAddPoint: boolean;
  canAddTrip: boolean;
  canManageFleet: boolean;
  canManageStaff: boolean;
  canManageFinance: boolean;
  canViewReports: boolean;
  canBoardingControl: boolean;
  canValidateTickets: boolean;
  canViewTrips: boolean;
  canViewManifest: boolean;
  canViewNotifications: boolean;
  canViewProfile: boolean;
  canEditProfile: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerPermissionService {
  private readonly partnerRoleSignal = signal<PartnerRole | null>(null);
  readonly partnerRole = this.partnerRoleSignal.asReadonly();
  readonly partnerRole$ = toObservable(this.partnerRoleSignal);

  private readonly permissionsSignal = signal<PartnerPermissions | null>(null);
  readonly permissions = this.permissionsSignal.asReadonly();
  readonly permissions$ = toObservable(this.permissionsSignal);

  constructor() {
    this.loadPartnerRole();
  }

  private loadPartnerRole(): void {
    const role = localStorage.getItem('transito_partner_user_role') as PartnerRole | null;
    if (role) {
      // Rôle trouvé, initialiser les permissions
      this.setPartnerRole(role);
    } else {
      // Pas de rôle trouvé, initialiser avec permissions par défaut
      const defaultPermissions = this.calculatePermissions(PartnerRole.AGENT_QUAI);
      this.permissionsSignal.set(defaultPermissions);
    }
  }

  setPartnerRole(role: PartnerRole): void {
    this.partnerRoleSignal.set(role);
    localStorage.setItem('transito_partner_user_role', role);
    this.updatePermissions(role);
  }

  getPartnerRole(): PartnerRole | null {
    return this.partnerRoleSignal();
  }

  getPermissions(): PartnerPermissions | null {
    return this.permissionsSignal();
  }

  hasPermission(permission: keyof PartnerPermissions): boolean {
    const permissions = this.permissionsSignal();
    if (!permissions) return false;
    return permissions[permission] === true;
  }

  hasRole(roles: PartnerRole[]): boolean {
    const userRole = this.getPartnerRole();
    if (!userRole) return false;
    return roles.includes(userRole);
  }

  private updatePermissions(role: PartnerRole): void {
    const permissions: PartnerPermissions = this.calculatePermissions(role);
    this.permissionsSignal.set(permissions);
  }

  private calculatePermissions(role: PartnerRole): PartnerPermissions {
    const basePermissions: PartnerPermissions = {
      canViewDashboard: false,
      canAddBus: false,
      canAddPoint: false,
      canAddTrip: false,
      canManageFleet: false,
      canManageStaff: false,
      canManageFinance: false,
      canViewReports: false,
      canBoardingControl: false,
      canValidateTickets: false,
      canViewTrips: false,
      canViewManifest: false,
      canViewNotifications: false,
      canViewProfile: true,
      canEditProfile: true,
    };

    switch (role) {
      // Admin de l'agence - accès complet à toutes les pages
      case PartnerRole.ADMIN_AGENCE:
        return {
          ...basePermissions,
          canViewDashboard: true,
          canAddBus: true,
          canAddPoint: true,
          canAddTrip: true,
          canManageFleet: true,
          canManageStaff: true,
          canManageFinance: true,
          canViewReports: true,
          canBoardingControl: true,
          canValidateTickets: true,
          canViewTrips: true,
          canViewManifest: true,
          canViewNotifications: true,
        };

      // Agent de quai - accès limité (validation des tickets)
      case PartnerRole.AGENT_QUAI:
        return {
          ...basePermissions,
          canValidateTickets: true,
          canViewTrips: true,
          canViewManifest: true,
          canViewNotifications: true,
        };

      default:
        return basePermissions;
    }
  }

  isWharfAgent(): boolean {
    return this.getPartnerRole() === PartnerRole.AGENT_QUAI;
  }

  isFullAccessUser(): boolean {
    const role = this.getPartnerRole();
    return role === PartnerRole.ADMIN_AGENCE;
  }

  isAgentQuai(): boolean {
    return this.getPartnerRole() === PartnerRole.AGENT_QUAI;
  }

  isAdminAgence(): boolean {
    return this.getPartnerRole() === PartnerRole.ADMIN_AGENCE;
  }

  reset(): void {
    this.partnerRoleSignal.set(null);
    this.permissionsSignal.set(null);
    localStorage.removeItem('transito_partner_user_role');
  }
}
