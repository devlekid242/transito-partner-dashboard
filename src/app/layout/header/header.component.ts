import { Component, Output, EventEmitter, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterLink, CommonModule],
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  readonly unreadCount = computed(() => this.realtimeNotificationService.unreadCountSignal());
  readonly currentUser = computed(() => this.authService.user());
  readonly currentRole = computed(() => this.authService.role());

  baseApiUrl: string = environment.baseApiUrl;

  constructor(
    public authService: AuthService,
    public sidebarService: SidebarService,
    private realtimeNotificationService: RealtimeNotificationService,
  ) {
    effect(() => {
      this.currentUser();
      this.currentRole();
    });
  }

  loadProfileImageUrl(): string {
    const user = this.currentUser();
    if (!user) {
      return '';
    }
    // console.log('Current user:', user);
    const profilePhotoUrl = user.profilePhotoUrl || user.photoUrl || user.profilePhoto || '';
    // console.log('Profile photo URL:', profilePhotoUrl);
    return this.normalizeImageUrl(profilePhotoUrl);
  }

  getUserFullName(): string {
    return this.currentUser() ? this.currentUser()!.fullName : '';
  }

  getUserRole(): string {
    return this.currentRole() ? this.currentRole()! : '';
  }

  getUserEmail(): string {
    return this.currentUser() ? this.currentUser()!.email : '';
  }

  getUserPhoneNumber(): string {
    return this.currentUser() ? this.currentUser()!.phoneNumber : '';
  }

  private normalizeImageUrl(url: string): string {
    const normalized = this.authService.normalizeImageUrl(url);
    return normalized || '';
  }

  logout() {
    this.authService.logout();
  }

  onToggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
