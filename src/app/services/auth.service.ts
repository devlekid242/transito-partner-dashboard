import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { PartnerPermissionService } from './partner-permission.service';
import { environment } from '../../environments/environment';

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

const STORAGE_TOKEN_KEY = 'transito_partner_access_token';
const STORAGE_REFRESH_TOKEN_KEY = 'transito_partner_refresh_token';
const STORAGE_USER_KEY = 'transito_partner_user_profile';
const STORAGE_ROLE_KEY = 'transito_partner_user_role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiUrl;
  private readonly token = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(null);
  private readonly currentUser = signal<UserProfile | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly user$ = toObservable(this.currentUser);
  private readonly currentRole = signal<string | null>(null);
  readonly role = this.currentRole.asReadonly();
  readonly role$ = toObservable(this.currentRole);

  constructor(
    private router: Router,
    private http: HttpClient,
    private permissionService: PartnerPermissionService,
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    const storedRole = localStorage.getItem(STORAGE_ROLE_KEY);

    if (storedToken) {
      this.token.set(storedToken);
    }
    if (storedRefreshToken) {
      this.refreshToken.set(storedRefreshToken);
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
      this.currentRole.set(storedRole);
      if (loadedUser) {
        loadedUser = { ...loadedUser, role: storedRole };
      }
    }

    this.currentUser.set(loadedUser);
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }

  getToken(): string | null {
    return this.token();
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  getUser(): UserProfile | null {
    return this.currentUser();
  }

  getRole(): string | null {
    return this.currentRole();
  }

  setRole(role: string) {
    this.currentRole.set(role);
    localStorage.setItem(STORAGE_ROLE_KEY, role);
    const currentUser = this.currentUser();
    if (currentUser) {
      this.currentUser.set({ ...currentUser, role });
    }
  }

  setUser(user: UserProfile | null): void {
    const normalizedUser = this.normalizeUserProfile(user);
    this.currentUser.set(normalizedUser);
    if (normalizedUser) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }

  private persistTokens(accessToken: string, refreshToken: string): void {
    this.token.set(accessToken);
    this.refreshToken.set(refreshToken);
    localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
    localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken);
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
    let role = ''; // Default role
    let agent = null;

    if (response.user) {
      if (response.user?.agent) {
        // Utiliser agentRole directement de la BDD (admin_agence ou agent_quai)
        role = response.user?.agent.agentRole;
        agent = response.user?.agent;
      }
      const normalizedUser = this.normalizeUserProfile({
        id: response.user.id,
        fullName: response.user.fullName,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        role,
        agent,
        profilePhotoUrl: response.user.profilePhotoUrl,
        prefNotifications: response.user.prefNotifications ?? 1,
        prefLanguage: response.user.prefLanguage ?? 'fr',
        prefDarkMode: response.user.prefDarkMode ?? 0,
      });
      this.currentUser.set(normalizedUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
      this.setRole(role);

      // Synchroniser avec le PartnerPermissionService pour les permissions du dashboard
      if (role) {
        this.permissionService.setPartnerRole(role as any);
      }
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.http
        .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, {
          email: email, // Send email if it looks like email, else treat as phone
          password,
        })
        .toPromise();

      if (response) {
        this.applyAuthResponse(response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken()) {
      return null;
    }

    try {
      const response = await this.http
        .post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, {
          refresh_token: this.refreshToken(),
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

  logout(redirect = true) {
    this.token.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    this.currentRole.set(null);

    // Reset les permissions du dashboard
    this.permissionService.reset();

    if (redirect) {
      this.router.navigate(['/connexion']);
    }
  }
}
