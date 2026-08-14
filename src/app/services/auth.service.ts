import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { PartnerPermissionService } from './partner-permission.service';
import { environment } from '../../environments/environment';
import { AlertService } from './alert.service';

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    roles?: string[];
    role?: string;
    permissions?: string[];
    prefNotifications?: number;
    prefLanguage?: string;
    prefDarkMode?: number;
    profilePhotoUrl?: string;
    agent?: any;
  };
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  permissions?: string[];
  profilePhotoUrl?: string;
  profilePhoto?: string;
  photoUrl?: string;
  prefNotifications?: number;
  prefLanguage?: string;
  prefDarkMode?: number;
  agent?: {
    agentRole: string;
    status: string;
    agency?: {
      id: number;
      name: string;
    };
  };
}

// V2 UI compat interface
export interface AuthUser {
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
  id?: number;
  agent?: any;
}

// Extend AuthUser with optional compatibility fields used by V2 UI
export interface AuthUser {
  fullName?: string;
  telephone?: string;
  phoneNumber?: string;
}

const STORAGE_TOKEN_KEY = 'transito_partner_access_token';
const STORAGE_REFRESH_TOKEN_KEY = 'transito_partner_refresh_token';
const STORAGE_USER_KEY = 'transito_partner_user_profile';
const STORAGE_ROLE_KEY = 'transito_partner_user_role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiUrl;
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly permissionService = inject(PartnerPermissionService);
  private readonly alertService = inject(AlertService);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<UserProfile | null>(null);
  private readonly currentRoleSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly user$ = toObservable(this.currentUserSignal);
  readonly role = this.currentRoleSignal.asReadonly();
  readonly role$ = toObservable(this.currentRoleSignal);

  // V2 UI binding compatibility: user signal returning AuthUser structure
  readonly user = computed<AuthUser | null>(() => {
    const u = this.currentUserSignal();
    if (!u) return null;
    const initials = u.fullName
      ? u.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';
    return {
      id: u.id,
      nom: u.fullName,
      email: u.email,
      role: u.role || this.currentRoleSignal() || 'admin_agence',
      permissions: u.permissions || [],
      avatar: initials,
      agent: u.agent,
    };
  });

  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;

    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    const storedRole = localStorage.getItem(STORAGE_ROLE_KEY);

    if (storedToken) {
      this.tokenSignal.set(storedToken);
    }
    if (storedRefreshToken) {
      this.refreshTokenSignal.set(storedRefreshToken);
    }

    let loadedUser: UserProfile | null = null;
    if (storedUser) {
      try {
        loadedUser = this.normalizeUserProfile(JSON.parse(storedUser));
      } catch {
        loadedUser = null;
      }
    }

    if (storedRole) {
      this.currentRoleSignal.set(storedRole);
      if (loadedUser) {
        loadedUser = { ...loadedUser, role: storedRole };
      }
      this.permissionService.setPartnerRole(storedRole);
    }

    this.currentUserSignal.set(loadedUser);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  getUser(): UserProfile | null {
    return this.currentUserSignal();
  }

  getRole(): string | null {
    return this.currentRoleSignal();
  }

  setRole(role: string) {
    this.currentRoleSignal.set(role);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
    }
    const curr = this.currentUserSignal();
    if (curr) {
      this.currentUserSignal.set({ ...curr, role });
    }
    this.permissionService.setPartnerRole(role);
  }

  setUser(user: UserProfile | null): void {
    const normalizedUser = this.normalizeUserProfile(user);
    this.currentUserSignal.set(normalizedUser);
    if (typeof localStorage !== 'undefined') {
      if (normalizedUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
  }

  private persistTokens(accessToken: string, refreshToken: string): void {
    this.tokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
      localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  public normalizeImageUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseApiUrl}${normalizedPath}`;
  }

  private normalizeUserProfile(user: UserProfile | null): UserProfile | null {
    if (!user) {
      return null;
    }
    const normalizedPhotoUrl = this.normalizeImageUrl(
      user.profilePhotoUrl || user.photoUrl || user.profilePhoto,
    );
    return {
      ...user,
      profilePhotoUrl: normalizedPhotoUrl,
      photoUrl: normalizedPhotoUrl,
      profilePhoto: normalizedPhotoUrl,
    };
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.persistTokens(response.token, response.refresh_token);
    let role = 'admin_agence';
    let agent = null;
    let permissions: string[] = [];

    if (response.user) {
      if (response.user?.agent) {
        role = response.user?.agent.agentRole || role;
        agent = response.user?.agent;
      }
      // Extract permissions from user if available
      permissions = response.user.permissions || [];
      const normalizedUser = this.normalizeUserProfile({
        id: response.user.id,
        fullName: response.user.fullName,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        role,
        permissions,
        agent,
        profilePhotoUrl: response.user.profilePhotoUrl,
        prefNotifications: response.user.prefNotifications ?? 1,
        prefLanguage: response.user.prefLanguage ?? 'fr',
        prefDarkMode: response.user.prefDarkMode ?? 0,
      });
      this.currentUserSignal.set(normalizedUser);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
      }
      this.setRole(role);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.http
        .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, {
          email,
          password,
        })
        .toPromise();

      if (response) {
        this.applyAuthResponse(response);
        return true;
      }
      this.alertService.error('Échec de la connexion. Veuillez vérifier vos identifiants.');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      this.alertService.error('Une erreur est survenue lors de la connexion.');
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshTokenSignal()) {
      return null;
    }
    try {
      const response = await this.http
        .post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, {
          refresh_token: this.refreshTokenSignal(),
        })
        .toPromise();

      if (response) {
        this.persistTokens(response.token, response.refresh_token);
        return response.token;
      }
      return null;
    } catch {
      this.logout(false);
      return null;
    }
  }

  logout(redirect = true): void {
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.currentRoleSignal.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_ROLE_KEY);
    }

    this.permissionService.reset();

    if (redirect) {
      this.router.navigate(['/auth/connexion']);
    }
  }

  requestPasswordReset(email: string): Promise<boolean> {
    if (!email) return Promise.resolve(false);
    return this.http
      .post(`${this.apiBaseUrl}/auth/forgot-password`, { email })
      .toPromise()
      .then(() => true)
      .catch(() => false);
  }
}
