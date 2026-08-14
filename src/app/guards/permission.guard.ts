import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard = (perm: string): CanActivateFn => {
  return () => {
    const perms = inject(PermissionService);
    const router = inject(Router);
    if (perms.hasPermission(perm)) return true;
    router.navigate(['/acces-refuse']);
    return false;
  };
};
