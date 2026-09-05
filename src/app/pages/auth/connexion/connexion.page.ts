import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon.component';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../components/toast/toast.component';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="flex min-h-screen">
      <!-- Left brand panel -->
      <div class="relative hidden w-1/2 flex-col justify-between bg-ink-950 p-12 lg:flex">
        <div class="flex items-center gap-2.5">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <app-icon name="bus-front" [size]="24" />
          </div>
          <div>
            <p class="text-lg font-bold text-white">Transito</p>
            <p class="text-xs text-ink-400">Portail Partenaire</p>
          </div>
        </div>
        <div>
          <h2 class="text-3xl font-bold leading-tight text-white">Gérez votre flotte en toute simplicité</h2>
          <p class="mt-3 text-ink-400">Suivez vos trajets, réservations et finances en temps réel.</p>
          <div class="mt-8 flex gap-6">
            <div>
              <p class="text-2xl font-bold text-brand-400">1 284</p>
              <p class="text-xs text-ink-400">Passagers ce mois</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-brand-400">14</p>
              <p class="text-xs text-ink-400">Trajets actifs</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-brand-400">720K</p>
              <p class="text-xs text-ink-400">Revenus FCFA</p>
            </div>
          </div>
        </div>
        <p class="text-xs text-ink-500">© 2026 Transito. Tous droits réservés.</p>
      </div>

      <!-- Right form -->
      <div class="flex w-full flex-col items-center justify-center bg-ink-50 p-6 lg:w-1/2">
        <div class="w-full max-w-sm">
          <div class="mb-8 flex items-center gap-2.5 lg:hidden">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <app-icon name="bus-front" [size]="24" />
            </div>
            <p class="text-lg font-bold text-ink-900">Transito Partner</p>
          </div>

          <h1 class="text-2xl font-bold text-ink-900">Connexion</h1>
          <p class="mt-1 text-sm text-ink-500">Bienvenue, connectez-vous à votre compte.</p>

          <form (ngSubmit)="submit()" class="mt-8 space-y-4">
            <div>
              <label class="label" for="email">Email</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                  <app-icon name="mail" [size]="16" />
                </span>
                <input id="email" type="email" class="input pl-9" placeholder="gestionnaire@flotte.com"
                  [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required />
              </div>
            </div>
            <div>
              <label class="label" for="password">Mot de passe</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                  <app-icon name="lock" [size]="16" />
                </span>
                <input id="password" [type]="showPwd() ? 'text' : 'password'" class="input pl-9 pr-10"
                  placeholder="••••••••" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  (click)="showPwd.set(!showPwd())">
                  <app-icon name="eye" [size]="16" />
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" class="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" name="remember" />
                Se souvenir de moi
              </label>
              <a routerLink="/auth/recuperation-de-compte" class="text-sm font-medium text-primary-600 hover:text-primary-700">
                Mot de passe oublié ?
              </a>
            </div>
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              @if (loading()) { Connexion... } @else { Se connecter }
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-ink-500">
            Pas encore de compte ?
            <a routerLink="/auth/recuperation-de-compte" class="font-semibold text-primary-600 hover:text-primary-700">Contactez-nous</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ConnexionPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = signal('');
  password = signal('');
  showPwd = signal(false);
  loading = signal(false);

  async submit() {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    try {
      const ok = await this.auth.login(this.email(), this.password());
      this.loading.set(false);
      if (ok) {
        this.toast.success('Connexion réussie. Bienvenue !');
        this.router.navigate(['/dashboard']);
      } else {
        this.toast.danger('Email ou mot de passe incorrect.');
      }
    } catch (err) {
      this.loading.set(false);
      this.toast.danger(err, 'Une erreur est survenue lors de la connexion.');
    }
  }
}
