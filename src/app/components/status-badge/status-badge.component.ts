import { Component, Input } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const MAP: Record<string, Tone> = {
  paye: 'success', confirme: 'success', verifie: 'success', actif: 'success',
  en_cours: 'info', planifie: 'info', valide: 'info',
  en_attente: 'warning', maintenance: 'warning', rejete: 'danger',
  annule: 'danger', echoue: 'danger', hors_service: 'danger',
  termine: 'neutral', inactif: 'neutral',
};
const ICON: Record<Tone, string> = {
  success: 'check-circle', info: 'info', warning: 'clock',
  danger: 'x-circle', neutral: 'circle-user',
};
const CLS: Record<Tone, string> = {
  success: 'bg-brand-50 text-brand-700 border-brand-200',
  info: 'bg-primary-50 text-primary-700 border-primary-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-ink-100 text-ink-600 border-ink-200',
};

const LABELS: Record<string, string> = {
  paye: 'Payé', confirme: 'Confirmé', verifie: 'Vérifié', actif: 'Actif',
  en_cours: 'En cours', planifie: 'Planifié', valide: 'Validé',
  en_attente: 'En attente', maintenance: 'Maintenance', rejete: 'Rejeté',
  annule: 'Annulé', echoue: 'Échoué', hors_service: 'Hors service',
  termine: 'Terminé', inactif: 'Inactif',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [IconComponent],
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold {{ cls }}">
      <app-icon [name]="icon" [size]="13" />
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() statut: string = 'neutral';
  get tone(): Tone {
    return MAP[this.statut] ?? 'neutral';
  }
  get cls(): string {
    return CLS[this.tone];
  }
  get icon(): any {
    return ICON[this.tone];
  }
  get label(): string {
    return LABELS[this.statut] ?? this.statut;
  }
}
