import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IconComponent } from '../../shared/icon.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { Agence, AgencyDocument, SelectOption } from '../../models';
import { environment } from '../../../environments/environment.prod';
import { ModalComponent } from '../../components/modal/modal.component';

@Component({
  selector: 'app-profil-agence',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    ModalComponent,
  ],
  templateUrl: './profil-agence.page.html',
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

  readonly payoutMsisdn = () => (this.agency() as any)?.payoutMsisdn || '';
  readonly pendingPayoutMsisdn = () => (this.agency() as any)?.pendingPayoutMsisdn || '';

  // Villes actives disponibles pour le select
  readonly cityOptions = signal<SelectOption[]>([]);
  readonly isLoadingCities = signal(true);

  readonly isSubmittingPayout = signal(false);

  // Modale d'ajout de document (KYC)
  readonly showDocumentModal = signal(false);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly documentTypeOptions: SelectOption[] = [
    { value: 'registration_certificate', label: 'Registre de commerce' },
    { value: 'tax_certificate', label: 'Attestation fiscale' },
    { value: 'id_document', label: "Pièce d'identité du représentant" },
    { value: 'operating_license', label: "Licence d'exploitation" },
    { value: 'other', label: 'Autre' },
  ];
  documentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    type: ['', [Validators.required]],
  });
  // Format Congo Brazzaville : 9 chiffres, avec ou sans indicatif +242 (aligné sur AgencyController::proposePayoutMsisdn).
  readonly payoutMsisdnControl = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.pattern(/^(\+?242)?0?\d{9}$/),
  ]);

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
    this.isLoadingCities.set(true);

    forkJoin({
      profile: this.api.getPartnerProfile(),
      cities: this.api.getCityOptions().pipe(catchError(() => of([] as SelectOption[]))),
    }).subscribe({
      next: ({ profile, cities }: { profile: any; cities: SelectOption[] }) => {
        const agency = profile?.agent?.agency || profile?.agence || profile?.agency;

        // Si la ville actuelle de l'agence a été désactivée entre-temps côté
        // admin, on la réinjecte dans la liste pour qu'elle reste sélectionnable.
        const currentCity = agency?.city || agency?.ville || '';
        const options =
          currentCity && !cities.some((c) => c.value === currentCity)
            ? [...cities, { value: currentCity, label: `${currentCity} (inactive)` }]
            : cities;
        this.cityOptions.set(options);
        this.isLoadingCities.set(false);

        if (agency) {
          this.api.setAgence(agency);
          this.patchAgency(agency);
          this.documents.set(agency.documents || []);
        }
        this.loadDocuments();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoadingCities.set(false);
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

  openDocumentModal(): void {
    this.documentForm.reset({ name: '', type: '' });
    this.selectedDocumentFile.set(null);
    this.showDocumentModal.set(true);
  }

  closeDocumentModal(): void {
    if (this.isSubmittingFile()) return;
    this.showDocumentModal.set(false);
    this.selectedDocumentFile.set(null);
    this.documentForm.reset({ name: '', type: '' });
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] ?? null;
    this.selectedDocumentFile.set(file);

    // Pré-remplit le nom à partir du fichier si le champ n'a pas encore été renseigné.
    if (file && !this.documentForm.controls.name.value) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      this.documentForm.controls.name.setValue(baseName);
    }
  }

  submitDocumentModal(): void {
    const file = this.selectedDocumentFile();
    if (this.documentForm.invalid || !file || this.isSubmittingFile()) {
      this.documentForm.markAllAsTouched();
      if (!file) this.toast.danger('Veuillez sélectionner un fichier.');
      return;
    }

    this.isSubmittingFile.set(true);
    const { name, type } = this.documentForm.getRawValue();

    this.api.uploadAgencyDocument(file, { name, type }).subscribe({
      next: (doc) => {
        this.documents.update((docs) => [doc, ...docs]);
        this.isSubmittingFile.set(false);
        this.showDocumentModal.set(false);
        this.selectedDocumentFile.set(null);
        this.documentForm.reset({ name: '', type: '' });
        this.toast.success('Document téléversé avec succès.');
      },
      error: () => {
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

  submitPayoutMsisdn(): void {
    if (this.payoutMsisdnControl.invalid || this.isSubmittingPayout()) {
      this.payoutMsisdnControl.markAsTouched();
      return;
    }

    const agencyId = this.agency()?.id;
    if (!agencyId) {
      this.toast.danger('Agence introuvable.');
      return;
    }

    this.isSubmittingPayout.set(true);
    this.api.proposePayoutMsisdn(agencyId, this.payoutMsisdnControl.value).subscribe({
      next: () => {
        this.toast.success('Numéro proposé, en attente de validation par un administrateur.');
        this.payoutMsisdnControl.reset('');
        this.isSubmittingPayout.set(false);
      },
      error: (err) => {
        this.isSubmittingPayout.set(false);
        const message = err?.error?.message || 'Impossible de proposer ce numéro.';
        this.toast.danger(message);
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
