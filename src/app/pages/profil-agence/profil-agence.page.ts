import { Component, OnInit, ViewChild, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormComponent, FormField } from '../../components/form/form.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerApiService } from '../../services/partner-api.service';
import { AuthService } from '../../services/auth.service';
import { PartnerProfile } from '../../models/partner.model';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { AlertService } from '../../services/alert.service';
import { scales } from 'chart.js';

@Component({
  selector: 'app-profil-agence',
  templateUrl: './profil-agence.page.html',
  styleUrls: ['./profil-agence.page.css'],
  imports: [FormComponent, ModalComponent, NotificationComponent, CommonModule, FormsModule],
})
export class ProfilAgencePage implements OnInit {
  ApiBaseUrl: string = environment.baseApiUrl; // Replace with your actual API
  // Form fields for agency profile
  profileFormFields = signal<FormField[]>([
    {
      key: 'agencyName',
      label: "Nom de l'Agence",
      type: 'text',
      required: true,
      placeholder: 'Nom de votre agence',
    },
    {
      key: 'registrationNumber',
      label: "Numéro d'Enregistrement",
      type: 'text',
      required: true,
      placeholder: 'RC-DLA-2021-B-XXXX',
    },
    {
      key: 'description',
      label: 'Description courte',
      type: 'textarea',
      required: false,
      placeholder: 'Description de votre agence',
      rows: 3,
    },
    {
      key: 'websiteUrl',
      label: 'Site Web',
      type: 'text',
      required: false,
      placeholder: 'https://www.votre-agence.com',
    },
    {
      key: 'bannerUrl',
      label: 'URL de la bannière',
      type: 'text',
      required: false,
      placeholder: 'https://.../banner.jpg',
    },
    {
      key: 'logoUrl',
      label: 'URL du logo',
      type: 'text',
      required: false,
      placeholder: 'https://.../logo.png',
    },
    {
      key: 'mapUrl',
      label: 'URL de la carte',
      type: 'text',
      required: false,
      placeholder: 'https://www.google.com/maps/...',
    },
    {
      key: 'email',
      label: 'Email Principal',
      type: 'email',
      required: true,
      placeholder: 'direction@agence.com',
    },
    {
      key: 'phone',
      label: 'Téléphone Support',
      type: 'tel',
      required: true,
      placeholder: '+237 6XX XXX XXX',
    },
    {
      key: 'address',
      label: 'Adresse Siège Social',
      type: 'text',
      required: true,
      placeholder: 'Adresse complète',
    },
  ]);

  // Documents data
  private readonly documentsSignal = signal<any[]>([]);
  documents = computed(() => this.documentsSignal());

  private readonly mapEmbedUrlSignal = signal<SafeResourceUrl | null>(null);
  mapEmbedUrl = computed(() => this.mapEmbedUrlSignal());

  // Modal states
  private readonly isSavingProfileSignal = signal<boolean>(false);
  isSavingProfile = computed(() => this.isSavingProfileSignal());

  private readonly isDocumentModalOpenSignal = signal<boolean>(false);
  isDocumentModalOpen = computed(() => this.isDocumentModalOpenSignal());

  private readonly isUploadingDocumentSignal = signal<boolean>(false);
  isUploadingDocument = computed(() => this.isUploadingDocumentSignal());

  private readonly isUploadingBannerSignal = signal<boolean>(false);
  isUploadingBanner = computed(() => this.isUploadingBannerSignal());

  private readonly isUploadingLogoSignal = signal<boolean>(false);
  isUploadingLogo = computed(() => this.isUploadingLogoSignal());

  private readonly isLoadingSignal = signal<boolean>(false);
  isLoading = computed(() => this.isLoadingSignal());

  // Modal state
  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly modalTitleSignal = signal<string>('');
  modalTitle = computed(() => this.modalTitleSignal());

  private readonly modalMessageSignal = signal<string>('');
  modalMessage = computed(() => this.modalMessageSignal());

  // Notification state
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  // Agency profile data
  private readonly profileDataSignal = signal<any>({});
  profileData = computed(() => this.profileDataSignal());

  private readonly activeSalesPointsSignal = signal<number>(0);
  activeSalesPoints = computed(() => this.activeSalesPointsSignal());

  // Document management
  documentFile?: File;
  private readonly documentFormSignal = signal({ name: '', type: '', expiryDate: '' });
  documentForm = computed(() => this.documentFormSignal());

  documentTypes = [
    { value: 'license', label: 'Licence' },
    { value: 'insurance', label: 'Assurance' },
    { value: 'registration', label: 'Immatriculation' },
    { value: 'other', label: 'Autre' },
  ];
  
  agencyStats = {
    activeSalesPoints: 0,
    nationalCoverage: '',
  };

  @ViewChild(FormComponent) profileForm?: FormComponent;

  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    public authService: AuthService,
    private sanitizer: DomSanitizer,
    private alertService: AlertService,
  ) {}

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoadingSignal.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoadingSignal.set(this.pendingLoadingRequests > 0);
  }

  ngOnInit() {
    this.loadProfileData();
    console.log('environment.baseApiUrl : ', environment.baseApiUrl);
  }

  loadProfileData() {
    this.beginLoading();
    this.partnerApiService
      .getPartnerProfile()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (profile: any) => {
          const agency = profile?.agent?.agency ?? null;
          this.profileDataSignal.set({
            agencyId: agency?.id,
            agencyName: agency?.name ?? profile?.fullName ?? '',
            registrationNumber: agency?.registrationNumber ?? '',
            description: agency?.description ?? '',
            email: profile?.email ?? '',
            phone: profile?.phoneNumber ?? '',
            address: agency?.address ?? '',
            bannerUrl: this.resolveAssetUrl(agency?.bannerUrl ?? ''),
            logoUrl: this.resolveAssetUrl(agency?.logoUrl ?? ''),
            mapUrl: agency?.mapUrl ?? '',
            websiteUrl: agency?.websiteUrl ?? '',
            documents: agency?.documents ?? [],
          });

          // Update form fields with loaded data values
          this.updateFormFields();
          this.updateMapUrl();
          this.documentsSignal.set([...(agency?.documents ?? [])]);

          // Load partner stats if available
          this.beginLoading();
          this.partnerApiService
            .getBusPoints(this.profileDataSignal().agencyId)
            .pipe(finalize(() => this.finishLoading()))
            .subscribe({
              next: (point: any) => {
                this.activeSalesPointsSignal.set(point.length);
              },
              error: () => {
                // leave defaults if endpoint not available
              },
            });

          // Update agency sales points and national coverage if available
          this.beginLoading();
          this.partnerApiService
            .getBusPoints()
            .pipe(finalize(() => this.finishLoading()))
            .subscribe({
              next: (point: any) => {
                this.activeSalesPointsSignal.set(point.length);
              },
              error: () => {
                // leave defaults if endpoint not available
              },
            });
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.showToastNotification('error', 'Erreur de chargement du profil');
          this.alertService.error('Erreur de chargement du profil de l’agence');
        },
      });
  }

  updateFormFields() {
    const profileData = this.profileData();
    this.profileFormFields.set(this.profileFormFields().map((field) => ({
      ...field,
      value: (profileData as any)[field.key] ?? field.value ?? '',
    })));
  }

  private getMapUrl(): string {
    const profileData = this.profileData();
    const query = profileData.mapUrl || profileData.address || profileData.agencyName || '';
    if (!query) {
      return 'about:blank';
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  }

  private updateMapUrl(): void {
    const url = this.getMapUrl();
    this.mapEmbedUrlSignal.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  private resolveAssetUrl(url: string): string {
    if (!url) {
      return '';
    }
    return url.startsWith('http') ? url : `${environment.baseApiUrl}${url}`;
  }

  onFormSubmit(formData: any): void {
    const profileData = this.profileData();
    const userPayload = {
      fullName: formData.agencyName || profileData.agencyName,
      email: formData.email,
      phoneNumber: formData.phone,
    };

    const agencyPayload = {
      name: formData.agencyName,
      registrationNumber: formData.registrationNumber,
      description: formData.description,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      websiteUrl: formData.websiteUrl,
      bannerUrl: formData.bannerUrl,
      logoUrl: formData.logoUrl,
      mapUrl: formData.mapUrl,
    };

    const requests = [this.partnerApiService.updatePartnerProfile(userPayload)];
    if (profileData.agencyId) {
      requests.push(this.partnerApiService.updateAgency(profileData.agencyId, agencyPayload));
    }

    this.isSavingProfileSignal.set(true);
    forkJoin(requests)
      .pipe(finalize(() => this.isSavingProfileSignal.set(false)))
      .subscribe({
        next: () => {
          this.showToastNotification('success', 'Profil mis à jour avec succès!');
          this.loadProfileData();
          this.modalTitleSignal.set('Profil Mis à Jour');
          this.modalMessageSignal.set(
            'Les informations de votre agence ont été mises à jour avec succès.',
          );
          this.isModalOpenSignal.set(true);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.showToastNotification('error', 'Erreur lors de la mise à jour du profil');
        },
      });
  }

  triggerProfileSave(): void {
    this.profileForm?.onSubmit();
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 5000);
  }

  uploadDocument(file: File): void {
    if (!file) {
      return;
    }

    this.partnerApiService.uploadAgencyDocument(file, { name: file.name }).subscribe({
      next: (document) => {
        this.showToastNotification('success', `Document ${document.name} téléversé avec succès.`);
        this.loadProfileData();
      },
      error: (error) => {
        console.error('Error uploading document:', error);
        this.showToastNotification('error', 'Impossible de téléverser le document.');
      },
    });
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadDocument(file);
    }
  }

  deleteDocument(document: any): void {
    if (!document?.id) {
      return;
    }

    this.partnerApiService.deleteAgencyDocument(document.id).subscribe({
      next: () => {
        this.documentsSignal.update((docs) => docs.filter((doc) => doc.id !== document.id));
        this.showToastNotification('success', `Document ${document.name} supprimé.`);
      },
      error: (error) => {
        console.error('Error deleting document:', error);
        this.showToastNotification('error', 'Impossible de supprimer le document.');
      },
    });
  }

  openDocumentModal(): void {
    this.documentFile = undefined;
    this.documentFormSignal.set({
      name: '',
      type: '',
      expiryDate: '',
    });
    this.isDocumentModalOpenSignal.set(true);
  }

  closeDocumentModal(): void {
    this.isDocumentModalOpenSignal.set(false);
  }

  onBannerFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const profileData = this.profileData();
    if (!file || !profileData.agencyId) {
      return;
    }
    this.isUploadingBannerSignal.set(true);
    this.partnerApiService
      .uploadAgencyImage(profileData.agencyId, file, 'banner')
      .pipe(finalize(() => this.isUploadingBannerSignal.set(false)))
      .subscribe({
        next: (agency) => {
          this.showToastNotification('success', 'Bannière mise à jour avec succès.');
          this.profileDataSignal.set({
            ...profileData,
            bannerUrl: this.resolveAssetUrl(agency.bannerUrl),
          });
          this.updateFormFields();
        },
        error: (error) => {
          console.error('Error uploading banner:', error);
          this.showToastNotification('error', 'Impossible de téléverser la bannière.');
        },
      });
  }

  onLogoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const profileData = this.profileData();
    if (!file || !profileData.agencyId) {
      return;
    }
    this.isUploadingLogoSignal.set(true);
    this.partnerApiService
      .uploadAgencyImage(profileData.agencyId, file, 'logo')
      .pipe(finalize(() => this.isUploadingLogoSignal.set(false)))
      .subscribe({
        next: (agency) => {
          this.showToastNotification('success', 'Logo mis à jour avec succès.');
          this.profileDataSignal.set({
            ...profileData,
            logoUrl: this.resolveAssetUrl(agency.logoUrl),
          });
          this.updateFormFields();
        },
        error: (error) => {
          console.error('Error uploading logo:', error);
          this.showToastNotification('error', 'Impossible de téléverser le logo.');
        },
      });
  }

  onDocumentFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.documentFile = file;
      this.documentFormSignal.update((form) => ({
        ...form,
        name: form.name || file.name,
      }));
    }
  }

  submitDocumentForm(): void {
    const documentForm = this.documentForm();
    if (!this.documentFile) {
      this.showToastNotification('error', 'Veuillez sélectionner un fichier.');
      return;
    }
    this.isUploadingDocumentSignal.set(true);

    const metadata: Record<string, string> = {
      name: documentForm.name || this.documentFile.name,
      type: documentForm.type,
    };
    if (documentForm.expiryDate) {
      metadata['expiryDate'] = documentForm.expiryDate;
    }

    this.partnerApiService
      .uploadAgencyDocument(this.documentFile, metadata)
      .pipe(finalize(() => this.isUploadingDocumentSignal.set(false)))
      .subscribe({
        next: (document) => {
          this.showToastNotification('success', `Document ${document.name} téléversé avec succès.`);
          this.loadProfileData();
          this.isDocumentModalOpenSignal.set(false);
        },
        error: (error) => {
          console.error('Error uploading document:', error);
          this.showToastNotification('error', 'Impossible de téléverser le document.');
        },
      });
  }

  closeModal(): void {
    this.isModalOpenSignal.set(false);
  }

}

