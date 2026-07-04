import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AgentGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const user = this.authService.getUser();

    // Check if user is authenticated and has agent role
    if (this.authService.isAuthenticated() && user?.agent) {
      return true;
    }

    // If not authenticated, redirect to login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/connexion']);
      return false;
    }

    // If authenticated but no agent, show unauthorized page or redirect
    console.warn("Accès refusé : utilisateur sans rôle d'agent");
    this.router.navigate(['/acces-refuse']);
    return false;
  }
}
