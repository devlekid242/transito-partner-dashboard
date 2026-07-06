import { Component, OnInit, signal, computed } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormComponent, FormField } from '../../components/form/form.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gestion-du-staff',
  templateUrl: './gestion-du-staff.page.html',
  styleUrls: ['./gestion-du-staff.page.css'],
  imports: [TableComponent, CommonModule, ModalComponent, FormComponent, NotificationComponent],
})
export class GestionDuStaffPage implements OnInit {
  // Staff members
  private readonly staffMembersSignal = signal<any[]>([]);
  staffMembers = computed(() => this.staffMembersSignal());

  // Modal states
  private readonly isModalOpenSignal = signal<boolean>(false);
  isModalOpen = computed(() => this.isModalOpenSignal());

  private readonly isFormModalOpenSignal = signal<boolean>(false);
  isFormModalOpen = computed(() => this.isFormModalOpenSignal());

  private readonly selectedStaffMemberSignal = signal<any>(null);
  selectedStaffMember = computed(() => this.selectedStaffMemberSignal());

  // Form state
  private readonly staffFormFieldsSignal = signal<FormField[]>([
    {
      key: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      required: false,
      placeholder: 'Enter phone number',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [],
    },
  ]);
  staffFormFields = computed(() => this.staffFormFieldsSignal());

  // Notification state
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>('');
  notificationMessage = computed(() => this.notificationMessageSignal());

  private readonly isLoadingSignal = signal<boolean>(false);
  isLoading = computed(() => this.isLoadingSignal());

  // Colonnes du tableau
  staffColumns: TableColumn[] = [
    { key: 'name', title: 'User', sortable: true },
    { key: 'role', title: 'Role', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ];

  // Actions du tableau
  staffActions: TableAction[] = [
    {
      icon: 'edit',
      label: 'Edit',
      action: (item) => this.editStaffMember(item),
    },
    {
      icon: 'block',
      label: 'Deactivate',
      action: (item) => this.deactivateStaffMember(item),
    },
  ];

  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    public authService: AuthService,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.partnerApiService.getRoleOptions().subscribe((options) => {
      const fields = this.staffFormFieldsSignal();
      const idx = fields.findIndex((f) => f.key === 'role');
      if (idx !== -1) {
        fields[idx].options = options;
        this.staffFormFieldsSignal.set([...fields]);
      }
    });

    this.partnerApiService.getStatusOptions().subscribe((options) => {
      const fields = this.staffFormFieldsSignal();
      const idx = fields.findIndex((f) => f.key === 'status');
      if (idx !== -1) {
        fields[idx].options = options;
        this.staffFormFieldsSignal.set([...fields]);
      }
    });
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoadingSignal.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoadingSignal.set(this.pendingLoadingRequests > 0);
  }

  ngOnInit() {
    this.loadStaffMembers();
  }

  loadStaffMembers() {
    this.beginLoading();
    // Try to load staff from API; if it fails, keep an empty list
    this.partnerApiService
      .getStaffMembers()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (staff: any) => {
          this.staffMembersSignal.set(
            staff.map((s: any) => ({
              id: s.id,
              name: s.fullName ?? s.name ?? s.email,
              email: s.email,
              role: s.role ?? s.roles?.[0] ?? 'Staff',
              status: s.status ?? 'Active',
              phone: s.phone ?? s.phoneNumber ?? '',
            })),
          );
        },
        error: (err) => {
          console.error('Unable to load staff from API, falling back to mock data', err);
          this.alertService.error('Erreur de chargement du personnel');
        },
      });
  }

  editStaffMember(member: any): void {
    this.selectedStaffMemberSignal.set({ ...member });
    this.isFormModalOpenSignal.set(true);
  }

  deactivateStaffMember(member: any): void {
    this.alertService
      .confirm('Désactiver le membre', `Désactiver ${member.name} ?`)
      .then((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.showToastNotification('warning', `Staff member ${member.name} deactivation requested`);
      });
  }

  inviteNewUser(): void {
    this.router.navigate(['/ajout-user']).catch(() => {
      // fallback: open modal
      this.selectedStaffMemberSignal.set({
        id: null,
        name: '',
        email: '',
        role: 'Staff',
        status: 'Invited',
        phone: '',
      });
      this.isFormModalOpenSignal.set(true);
    });
  }

  closeModal(): void {
    this.isModalOpenSignal.set(false);
    this.isFormModalOpenSignal.set(false);
    this.selectedStaffMemberSignal.set(null);
  }

  onFormSubmit(formData: any): void {
    console.log('Form submitted:', formData);
    if (this.selectedStaffMemberSignal()?.id) {
      // Update existing member
      this.showToastNotification('success', `Staff member ${formData.name} updated successfully!`);
    } else {
      // Add new member
      this.showToastNotification('success', `Invitation sent to ${formData.email} successfully!`);
    }
    this.closeModal();
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationTypeSignal.set(type);
    this.notificationMessageSignal.set(message);
    this.showNotificationSignal.set(true);

    setTimeout(() => {
      this.showNotificationSignal.set(false);
    }, 5000);
  }

  onSortChange(event: { key: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
    // Logique de tri à implémenter
  }

  // Role distribution data
  roleDistribution = signal([
    { role: 'Admin', count: 2, percentage: 20 },
    { role: 'Manager', count: 3, percentage: 30 },
    { role: 'Staff', count: 5, percentage: 50 },
  ]);

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
