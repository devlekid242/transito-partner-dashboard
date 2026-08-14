import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export enum PartnerRole {
  ADMIN_AGENCE = 'admin_agence',
  AGENT_QUAI = 'agent_quai',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
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
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerPermissionService {
  private readonly partnerRoleSignal = signal<PartnerRole | string | null>(null);
  readonly partnerRole = this.partnerRoleSignal.asReadonly();
  readonly partnerRole$ = toObservable(this.partnerRoleSignal);

  private readonly permissionsSignal = signal<PartnerPermissions | null>(null);
  readonly permissions = this.permissionsSignal.asReadonly();
  readonly permissions$ = toObservable(this.permissionsSignal);

  constructor() {
    this.loadPartnerRole();
  }

  private loadPartnerRole(): void {
    const role = localStorage.getItem('transito_partner_user_role') as PartnerRole | string | null;
    if (role) {
      this.setPartnerRole(role);
    } else {
      const defaultPermissions = this.calculatePermissions(PartnerRole.ADMIN_AGENCE);
      this.permissionsSignal.set(defaultPermissions);
    }
  }

  setPartnerRole(role: PartnerRole | string): void {
    this.partnerRoleSignal.set(role);
    localStorage.setItem('transito_partner_user_role', role);
    this.updatePermissions(role);
  }

  getPartnerRole(): PartnerRole | string | null {
    return this.partnerRoleSignal();
  }

  getPermissions(): PartnerPermissions | null {
    return this.permissionsSignal();
  }

  getUserPermissions(): string[] | null {
    // Try to get permissions from localStorage if available
    const storedUser = localStorage.getItem('transito_partner_user_profile');
    if (storedUser) {
      try {
        const userProfile = JSON.parse(storedUser);
        return userProfile.permissions || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  hasPermission(permission: keyof PartnerPermissions | string): boolean {
    const permissions = this.permissionsSignal();
    if (!permissions) return true;
    if (permission in permissions) {
      return permissions[permission] === true;
    }
    // Fallback logic for V2 string keys like 'dashboard', 'gestion-flotte'
    // Get permissions from the partner profile
    const userPermissions = this.getUserPermissions();
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions.includes(permission as string);
    }
    // Default fallback based on role
    const role = this.getPartnerRole();
    if (!role || role === PartnerRole.ADMIN_AGENCE || role === PartnerRole.ADMIN || role === 'admin') {
      return true;
    }
    return false;
  }

  hasRole(roles: (PartnerRole | string)[]): boolean {
    const userRole = this.getPartnerRole();
    if (!userRole) return false;
    return roles.includes(userRole);
  }

  private updatePermissions(role: PartnerRole | string): void {
    const permissions: PartnerPermissions = this.calculatePermissions(role);
    this.permissionsSignal.set(permissions);
  }

  private calculatePermissions(role: PartnerRole | string): PartnerPermissions {
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
      dashboard: false,
      'gestion-flotte': false,
      'gestion-point-embarquement': false,
      trajet: false,
      'demande-de-retrait': false,
      'gestion-finance': false,
      'gestion-du-staff': false,
      'rapport-analyse': false,
      'profil-agence': false,
    };

    switch (role) {
      case PartnerRole.ADMIN_AGENCE:
      case PartnerRole.ADMIN:
      case 'admin':
      case 'admin_agence':
      case 'manager':
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
          dashboard: true,
          'gestion-flotte': true,
          'gestion-point-embarquement': true,
          trajet: true,
          'demande-de-retrait': true,
          'gestion-finance': true,
          'gestion-du-staff': true,
          'rapport-analyse': true,
          'profil-agence': true,
        };

      case PartnerRole.AGENT_QUAI:
      case 'agent_quai':
      case 'agent':
      case 'staff':
      case 'conducteur':
        return {
          ...basePermissions,
          canValidateTickets: true,
          canViewTrips: true,
          canViewManifest: true,
          canViewNotifications: true,
          trajet: true,
        };

      default:
        return basePermissions;
    }
  }

  isWharfAgent(): boolean {
    const role = this.getPartnerRole();
    return role === PartnerRole.AGENT_QUAI || role === 'agent_quai';
  }

  isFullAccessUser(): boolean {
    const role = this.getPartnerRole();
    return role === PartnerRole.ADMIN_AGENCE || role === 'admin_agence' || role === 'admin';
  }

  isAgentQuai(): boolean {
    return this.isWharfAgent();
  }

  isAdminAgence(): boolean {
    return this.isFullAccessUser();
  }

  reset(): void {
    this.partnerRoleSignal.set(null);
    this.permissionsSignal.set(null);
    localStorage.removeItem('transito_partner_user_role');
  }
}
