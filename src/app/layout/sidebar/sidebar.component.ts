import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PartnerPermissionService } from '../../services/partner-permission.service';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [RouterLink, RouterLinkActive, CommonModule],
})
export class SidebarComponent implements OnInit {
  @Output() navigationClick = new EventEmitter<void>();

  logoUrl: string = environment.baseApiUrl + '/assets/logo.png';

  constructor(
    public permissionService: PartnerPermissionService,
    private partnerApiService: PartnerApiService,
  ) {}

  ngOnInit(): void {
    this.partnerApiService.getPartnerProfile().subscribe(
      (p) => {
        this.logoUrl = this.normalizeImageUrl(p?.profilePhotoUrl ?? this.logoUrl);
      },
      () => {},
    );
  }

  private normalizeImageUrl(url: string): string {
    if (!url) {
      return this.logoUrl;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${environment.baseApiUrl}${normalizedPath}`;
  }

  onNavigation(): void {
    // Émet un événement quand l'utilisateur clique sur une navigation
    this.navigationClick.emit();
  }
}
