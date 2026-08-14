import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { Agence, AgencyDocument } from '../../models';
import { environment } from '../../../environments/environment';
import { ModalComponent } from '../../components/modal/modal.component';


@Component({
  selector: 'app-profil-agence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, PageHeaderComponent, StatusBadgeComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Profil de l'agence"
        subtitle="Gérez l'identité, les coordonnées et les informations publiques de votre agence"
        icon="building"
      />

      @if (isLoading()) {
        <div class="card flex min-h-64 items-center justify-center p-8">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600"></div>
          <span class="ml-3 text-sm text-ink-500">Chargement du profil...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <!-- Colonne identité -->
          <aside class="space-y-6">
            <section class="card overflow-hidden">
              <div class="relative h-32 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500">
                @if (agencyBanner()) {
                  <img [src]="baseApiUrl + agencyBanner()" alt="Bannière de l'agence" class="h-full w-full object-cover" />
                  <div class="absolute inset-0 bg-black/25"></div>
                }
                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"></div>
              </div>

              <div class="px-6 pb-6">
                <div class="-mt-12 flex items-end justify-between gap-3">
                  <div class="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-50 text-brand-600 shadow-lg">
                    @if (agencyLogo()) {
                      <img [src]="baseApiUrl + agencyLogo()" alt="Logo de l'agence" class="h-full w-full object-cover" />
                    } @else {
                      <app-icon name="building" [size]="38" />
                    }
                  </div>

                  <label class="btn btn-secondary mb-1 cursor-pointer bg-white">
                    <app-icon name="image" [size]="16" />
                    Logo
                    <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="uploadImage($event, 'logo')" />
                  </label>
                </div>

                <div class="mt-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl font-bold text-ink-900">{{ agency().name || 'Agence' }}</h2>
                    @if (agency().isVerified) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                        <app-icon name="verified" [size]="13" /> Vérifiée
                      </span>
                    }
                  </div>
                  <p class="mt-1 text-sm text-ink-500">
                    {{ agency().city || 'Ville non renseignée' }}
                    @if (agency().status) { · {{ agency().status }} }
                  </p>
                </div>

                <div class="mt-5 grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-ink-400">Note</p>
                    <p class="mt-1 text-lg font-bold text-ink-900">{{ agency().ratingCache || '0.00' }}</p>
                  </div>
                  <div class="rounded-xl bg-ink-50 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-ink-400">Agence depuis</p>
                    <p class="mt-1 text-sm font-bold text-ink-900">{{ formatDate(agency().createdAt) }}</p>
                  </div>
                </div>

                <div class="mt-5 space-y-3 border-t border-ink-100 pt-5 text-sm">
                  <div class="flex items-start gap-3 text-ink-600">
                    <span class="mt-0.5 text-brand-600"><app-icon name="mail" [size]="16" /></span>
                    <span class="min-w-0 break-all">{{ agency().email || 'Email non renseigné' }}</span>
                  </div>
                  <div class="flex items-start gap-3 text-ink-600">
                    <span class="mt-0.5 text-brand-600"><app-icon name="phone" [size]="16" /></span>
                    <span>{{ agency().phone || 'Téléphone non renseigné' }}</span>
                  </div>
                  <div class="flex items-start gap-3 text-ink-600">
                    <span class="mt-0.5 text-brand-600"><app-icon name="map-pin" [size]="16" /></span>
                    <span>{{ agency().address || 'Adresse non renseignée' }}{{ agency().city ? ', ' + agency().city : '' }}</span>
                  </div>
                </div>

                <label class="btn btn-secondary mt-5 w-full cursor-pointer justify-center">
                  <app-icon name="image" [size]="16" />
                  {{ agencyBanner() ? 'Modifier la bannière' : 'Ajouter une bannière' }}
                  <input type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="uploadImage($event, 'banner')" />
                </label>
              </div>
            </section>

            <section class="card p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <app-icon name="shield-check" [size]="18" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-ink-900">État de l'agence</h3>
                  <p class="text-xs text-ink-500">Informations gérées par la plateforme</p>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                <span class="text-sm text-ink-500">Statut</span>
                <app-status-badge [statut]="String(agency().status || '')" />
              </div>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-sm text-ink-500">Vérification</span>
                <span class="text-sm font-semibold" [class.text-brand-700]="agency().isVerified" [class.text-amber-600]="!agency().isVerified">
                  {{ agency().isVerified ? 'Vérifiée' : 'En attente' }}
                </span>
              </div>
              @if (agency().commissionRate) {
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-sm text-ink-500">Commission plateforme</span>
                  <span class="text-sm font-semibold text-ink-800">{{ agency().commissionRate }}%</span>
                </div>
              }
            </section>
          </aside>

          <!-- Colonne formulaire -->
          <div class="space-y-6">
            <section class="card p-6">
              <div class="flex flex-col gap-2 border-b border-ink-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-base font-bold text-ink-900">Informations de l'agence</h3>
                  <p class="mt-1 text-sm text-ink-500">Les informations ci-dessous correspondent directement aux données de l'agence.</p>
                </div>
                <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Profil public</span>
              </div>

              <form [formGroup]="agencyForm" (ngSubmit)="save()" class="mt-6 space-y-7">
                <div>
                  <div class="mb-4 flex items-center gap-2">
                    <span class="text-brand-600"><app-icon name="building" [size]="17" /></span>
                    <h4 class="text-sm font-bold text-ink-900">Identité légale</h4>
                  </div>
                  <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label class="label" for="name">Nom de l'agence</label>
                      <input id="name" class="input" formControlName="name" />
                      @if (agencyForm.controls.name.invalid && agencyForm.controls.name.touched) {
                        <p class="mt-1 text-xs text-danger-600">Le nom de l'agence est obligatoire.</p>
                      }
                    </div>
                    <div>
                      <label class="label" for="registrationNumber">Numéro d'immatriculation</label>
                      <input id="registrationNumber" class="input" formControlName="registrationNumber" placeholder="RCCM / registre" />
                    </div>
                    <div class="md:col-span-2">
                      <label class="label" for="legalRepresentative">Représentant légal</label>
                      <input id="legalRepresentative" class="input" formControlName="legalRepresentative" placeholder="Nom du représentant légal" />
                    </div>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-6">
                  <div class="mb-4 flex items-center gap-2">
                    <span class="text-brand-600"><app-icon name="phone" [size]="17" /></span>
                    <h4 class="text-sm font-bold text-ink-900">Coordonnées</h4>
                  </div>
                  <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label class="label" for="email">Email</label>
                      <input id="email" type="email" class="input" formControlName="email" />
                    </div>
                    <div>
                      <label class="label" for="phone">Téléphone</label>
                      <input id="phone" class="input" formControlName="phone" placeholder="+242..." />
                    </div>
                    <div>
                      <label class="label" for="city">Ville</label>
                      <input id="city" class="input" formControlName="city" placeholder="Brazzaville" />
                    </div>
                    <div>
                      <label class="label" for="address">Adresse</label>
                      <input id="address" class="input" formControlName="address" placeholder="Adresse / quartier" />
                    </div>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-6">
                  <div class="mb-4 flex items-center gap-2">
                    <span class="text-brand-600"><app-icon name="globe" [size]="17" /></span>
                    <h4 class="text-sm font-bold text-ink-900">Présence en ligne</h4>
                  </div>
                  <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label class="label" for="websiteUrl">Site web</label>
                      <input id="websiteUrl" type="url" class="input" formControlName="websiteUrl" placeholder="https://..." />
                    </div>
                    <div>
                      <label class="label" for="mapUrl">Lien Google Maps</label>
                      <input id="mapUrl" type="url" class="input" formControlName="mapUrl" placeholder="https://maps.google.com/..." />
                    </div>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-6">
                  <div class="mb-4 flex items-center gap-2">
                    <span class="text-brand-600"><app-icon name="file-text" [size]="17" /></span>
                    <h4 class="text-sm font-bold text-ink-900">Présentation</h4>
                  </div>
                  <textarea id="description" rows="5" class="input resize-y" formControlName="description" placeholder="Présentez brièvement votre agence et ses services..."></textarea>
                  <p class="mt-1 text-xs text-ink-400">Cette description peut être utilisée sur les pages publiques de l'agence.</p>
                </div>

                <div class="flex flex-col-reverse gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p class="text-xs text-ink-400">Les informations de statut, de vérification et de commission sont gérées par la plateforme.</p>
                  <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                    @if (isSubmitting()) {
                      <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                      Enregistrement...
                    } @else {
                      <app-icon name="save" [size]="16" /> Enregistrer les modifications
                    }
                  </button>
                </div>
              </form>
            </section>

            <section class="card p-6">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <app-icon name="folder" [size]="18" />
                    </div>
                    <h3 class="font-bold text-ink-900">Documents de l'agence</h3>
                  </div>
                  <p class="mt-2 text-sm text-ink-500">Conservez ici les justificatifs demandés par la plateforme.</p>
                </div>
                <label class="btn btn-primary cursor-pointer">
                  <app-icon name="upload" [size]="16" /> Ajouter un document
                  <input type="file" class="hidden" accept="application/pdf,image/png,image/jpeg" (change)="uploadDocument($event)" />
                </label>
              </div>

              <div class="mt-5 overflow-hidden rounded-xl border border-ink-100">
                @for (doc of documents(); track doc.id) {
                  <div class="flex items-center justify-between gap-4 border-b border-ink-100 p-4 last:border-b-0 hover:bg-ink-50">
                    <div class="flex min-w-0 items-center gap-3">
                      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                        <app-icon name="file-text" [size]="18" />
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-ink-800">{{ doc.name }}</p>
                        <p class="mt-0.5 text-xs text-ink-500">
                          {{ doc.type || 'Document' }}
                          @if (doc.expiryDate) { · Expire le {{ doc.expiryDate | date:'dd/MM/yyyy' }} }
                        </p>
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      @if (doc.status) {
                        <span class="hidden rounded-full bg-ink-100 px-2 py-1 text-[11px] font-semibold text-ink-600 sm:inline-flex">{{ doc.status }}</span>
                      }
                      @if (doc.fileUrl) {
                        <a class="btn btn-secondary" [href]="doc.fileUrl" target="_blank" rel="noopener">Ouvrir</a>
                      }
                      <button type="button" class="btn btn-danger" (click)="deleteDocument(doc)">Supprimer</button>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                      <app-icon name="folder" [size]="22" />
                    </div>
                    <p class="mt-3 text-sm font-semibold text-ink-700">Aucun document enregistré</p>
                    <p class="mt-1 max-w-md text-xs text-ink-400">Ajoutez les justificatifs nécessaires à la vérification de votre agence.</p>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>
      }
    </div>
    @if(isSubmittingFile()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div class="flex flex-col items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          <p class="text-sm text-ink-700">Action en cours...</p>
        </div>
      </div>
    }
  `,
})
export class ProfilAgencePage implements OnInit {
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly isSubmittingFile = signal(false);
  readonly documents = signal<AgencyDocument[]>([]);
  readonly agency = this.api.agence;

  readonly baseApiUrl = environment.baseApiUrl;

  readonly agencyLogo = () => {
    const a = this.agency();
    return a?.logoUrl || '';
  };

  readonly agencyBanner = () => {
    const a = this.agency();
    return a?.bannerUrl || '';
  };

  agencyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    registrationNumber: ['', [Validators.maxLength(100)]],
    legalRepresentative: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20)]],
    city: ['', [Validators.maxLength(50)]],
    address: ['', [Validators.maxLength(255)]],
    websiteUrl: ['', [Validators.maxLength(255)]],
    mapUrl: ['', [Validators.maxLength(500)]],
    description: [''],
  });

  ngOnInit(): void {
    this.api.getPartnerProfile().subscribe({
      next: (profile: any) => {
        const agency = profile?.agent?.agency || profile?.agence || profile?.agency;
        if (agency) {
          this.api.setAgence(agency);
          this.patchAgency(agency);
          this.documents.set(agency.documents || []);
        }
        this.loadDocuments();
        this.isLoading.set(false);
      },
      error: () => {
        this.loadDocuments();
        this.isLoading.set(false);
        this.toast.danger('Impossible de charger le profil de l’agence.');
      },
    });
  }

  private patchAgency(a: any): void {
    this.agencyForm.patchValue({
      name: a?.name || a?.nom || '',
      registrationNumber: a?.registrationNumber || '',
      legalRepresentative: a?.legalRepresentative || '',
      email: a?.email || '',
      phone: a?.phone || a?.telephone || '',
      city: a?.city || a?.ville || '',
      address: a?.address || a?.adresse || '',
      websiteUrl: a?.websiteUrl || '',
      mapUrl: a?.mapUrl || '',
      description: a?.description || '',
    });
  }

  private loadDocuments(): void {
    this.api.getAgencyDocuments().subscribe({
      next: (docs) => this.documents.set(docs || []),
      error: () => this.documents.set([]),
    });
  }

  save(): void {
    if (this.agencyForm.invalid || this.isSubmitting()) {
      this.agencyForm.markAllAsTouched();
      return;
    }

    const agencyId = this.agency()?.id;
    if (!agencyId) {
      this.toast.danger('Agence introuvable.');
      return;
    }

    this.isSubmitting.set(true);
    const value = this.agencyForm.getRawValue();
    const payload = {
      name: value.name || undefined,
      email: value.email || undefined,
      phone: value.phone || undefined,
      address: value.address || undefined,
      city: value.city || undefined,
      registrationNumber: value.registrationNumber || undefined,
      legalRepresentative: value.legalRepresentative || undefined,
      websiteUrl: value.websiteUrl || undefined,
      mapUrl: value.mapUrl || undefined,
      description: value.description || undefined,
    };

    this.api.updateAgency(agencyId, payload).subscribe({
      next: (updated: any) => {
        this.api.setAgence({
          ...this.agency(),
          ...payload,
          ...(updated || {}),
        });
        this.patchAgency(this.agency());
        this.toast.success('Profil de l’agence mis à jour avec succès.');
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toast.danger('Impossible de mettre à jour le profil de l’agence.');
        this.isSubmitting.set(false);
      },
    });
  }

  uploadImage(event: Event, type: 'logo' | 'banner'): void {
    this.isSubmittingFile.set(true);
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    const agencyId = this.agency()?.id;
    if (!file || !agencyId) return;

    this.api.uploadAgencyImage(agencyId, file, type).subscribe({
      next: (response: any) => {
        const key = type === 'logo' ? 'logoUrl' : 'bannerUrl';
        const url = response?.[key] || response?.url || response?.[type];
        if (url) this.api.setAgence({ ...this.agency(), [key]: url });
        input.value = '';
        this.toast.success(`${type === 'logo' ? 'Logo' : 'Bannière'} mis à jour.`);
        this.isSubmittingFile.set(false);
      },
      error: () => {
        input.value = '';
        this.isSubmittingFile.set(false);
        this.toast.danger(`Impossible de mettre à jour le ${type}.`);
      },
    });
  }

  uploadDocument(event: Event): void {
    this.isSubmittingFile.set(true);
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.api.uploadAgencyDocument(file, { name: file.name }).subscribe({
      next: (doc) => {
        this.documents.update((docs) => [doc, ...docs]);
        input.value = '';
        this.isSubmittingFile.set(false);
        this.toast.success('Document téléversé avec succès.');
      },
      error: () => {
        input.value = '';
        this.isSubmittingFile.set(false);
        this.toast.danger('Impossible de téléverser le document.');
      },
    });
  }

  deleteDocument(doc: AgencyDocument): void {
    this.isSubmittingFile.set(true);
    if (!doc?.id) return;
    this.api.deleteAgencyDocument(doc.id).subscribe({
      next: () => {
        this.documents.update((docs) => docs.filter((d) => d.id !== doc.id));
        this.isSubmittingFile.set(false);
        this.toast.success('Document supprimé.');

      },
      error: () => {
        this.isSubmittingFile.set(false);
        this.toast.danger('Impossible de supprimer le document.');
      },
    });
  }

  formatDate(value?: string | Date | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }

  String(value: unknown): string {
    return value == null ? '' : String(value);
  }
}
