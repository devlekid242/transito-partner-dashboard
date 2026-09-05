import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon.component';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../components/toast/toast.component';

@Component({
  selector: 'app-recuperation-de-compte',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div class="w-full max-w-md">
        <div class="mb-6 flex items-center gap-2.5">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <app-icon name="bus-front" [size]="24" />
          </div>
          <div>
            <p class="text-lg font-bold text-ink-900">Transito</p>
            <p class="text-xs text-ink-500">Portail Partenaire</p>
          </div>
        </div>

        <div class="card p-8">
          <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <app-icon name="mail" [size]="28" />
          </div>
          <h1 class="text-2xl font-bold text-ink-900">Récupération de compte</h1>
          <p class="mt-1 text-sm text-ink-500">
            Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          @if (!sent()) {
            <form (ngSubmit)="submit()" class="mt-6 space-y-4">
              <div>
                <label class="label" for="email">Email</label>
                <div class="relative">
                  <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                    <app-icon name="mail" [size]="16" />
                  </span>
                  <input id="email" type="email" class="input pl-9" placeholder="vous@transito.ci"
                    [(ngModel)]="email" name="email" required />
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
                @if (loading()) { Envoi... } @else { Envoyer le lien }
              </button>
            </form>
          } @else {
            <div class="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
              <p class="flex items-center gap-2 font-semibold">
                <app-icon name="check-circle" [size]="18" /> Email envoyé
              </p>
              <p class="mt-1">Un lien de réinitialisation a été envoyé à {{ email() }}.</p>
            </div>
            <button class="btn btn-secondary mt-4 w-full" (click)="sent.set(false)">Renvoyer</button>
          }

          <a routerLink="/auth/connexion" class="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
            <app-icon name="arrow-left" [size]="16" /> Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RecuperationDeComptePage {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  email = signal('');
  loading = signal(false);
  sent = signal(false);

  submit() {
    if (!this.email()) return;
    this.loading.set(true);
    
    this.auth.requestPasswordReset(this.email()).then(
      (res: any) => {
        this.loading.set(false);
        this.sent.set(true);
        this.toast.success(res, 'Lien de réinitialisation envoyé.');
      }
    ).catch((err) => {
      this.loading.set(false);
      this.toast.danger(err, 'Impossible d\'envoyer le lien de réinitialisation. Vérifiez votre email.');
    });
  }
}
