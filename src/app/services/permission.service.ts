import { Injectable, inject } from '@angular/core';
import { PartnerPermissionService } from './partner-permission.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private partnerPerms = inject(PartnerPermissionService);

  hasPermission(key: string): boolean {
    return this.partnerPerms.hasPermission(key);
  }
}
