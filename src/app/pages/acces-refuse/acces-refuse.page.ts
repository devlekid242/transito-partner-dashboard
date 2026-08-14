import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-acces-refuse',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center bg-ink-50 p-6 text-center">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
        <app-icon name="shield-check" [size]="40" [strokeWidth]="1.5" />
      </div>
      <h1 class="mt-6 text-3xl font-bold text-ink-900">Accès refusé</h1>
      <p class="mt-2 max-w-md text-ink-500">
        Vous n'avez pas la permission d'accéder à cette page. Contactez votre administrateur si vous pensez que c'est une erreur.
      </p>
      <a routerLink="/dashboard" class="btn btn-primary mt-6">
        <app-icon name="arrow-left" [size]="16" /> Retour au tableau de bord
      </a>
    </div>
  `,
})
export class AccesRefusePage {}
