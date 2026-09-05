import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { ColumnDef, ActionDef, Utilisateur, RoleUtilisateur, SelectOption } from '../../models';

@Component({
  selector: 'app-gestion-du-staff',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatCardComponent,
    DatatableComponent,
    PageHeaderComponent,
    ModalComponent,
  ],
  templateUrl: './gestion-du-staff.page.html',
  
})
export class GestionDuStaffPage implements OnInit {
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly isDeleting = signal<boolean>(false);
  readonly isDeleteConfirmOpen = signal<boolean>(false);
  readonly isUserDetailOpen = signal<boolean>(false);
  readonly roleOptions = signal<SelectOption[]>([]);
  readonly selectedUser = signal<Utilisateur | null>(null);
  
  // Selected user for deletion
  selectedUserId: string | null = null;
  selectedUserName = signal<string>('');

  constructor() {
    this.loadRoleOptions();
  }

  ngOnInit(): void {
    // Ensure staff is loaded
    if (this.api.staff().length === 0) {
      this.api.getStaffMembers().subscribe({
        next: () => this.isLoading.set(false),
        error: (err) => {
          console.error('Error loading staff:', err);
          this.toast.danger(err, 'Impossible de charger le personnel');
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  loadRoleOptions(): void {
    this.api.getRoleOptions().subscribe({
      next: (options) => this.roleOptions.set(options),
      error: (err) => console.error('Error loading role options:', err),
    });
  }

  getRoleLabel(roleKey: string): string {
    const normalizedRole = String(roleKey || '').trim().toLowerCase();
    const roleLabels: Record<string, string> = {
      admin: 'Administrateur',
      admin_agence: 'Administrateur',
      manager: 'Administrateur',
      agent: 'Agent de quai',
      agent_quai: 'Agent de quai',
      agentdequai: 'Agent de quai',
      quai: 'Agent de quai',
    };
    if (roleLabels[normalizedRole]) return roleLabels[normalizedRole];

    const found = this.roleOptions().find(
      (option) => String(option.value).toLowerCase() === normalizedRole,
    );
    return found?.label || roleKey || 'Rôle non défini';
  }

  totalStaff = computed(() => this.api.staff().length);
  actifs = computed(() => this.api.staff().filter((u) => u.statut === 'actif' || u.status === 'active').length);
  inactifs = computed(() => this.api.staff().filter((u) => u.statut === 'inactif' || u.status === 'inactive').length);

  staffWithRole = computed(() =>
    this.api.staff().map((u) => ({
      ...u,
      roleLabel: this.getRoleLabel(u.role || u.agentRole || '')
    })),
  );

  cols: ColumnDef[] = [
    { key: 'fullName', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phoneNumber', label: 'Téléphone', sortable: true },
    { key: 'roleLabel', label: 'Rôle', sortable: true },
    { key: 'created_at', label: 'Date création', type: 'date', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
  ];

  actions: ActionDef[] = [
    {
      label: 'Voir',
      icon: 'eye',
      class: 'ghost',
      action: (u: Utilisateur) => this.viewUser(u),
    },
    {
      label: 'Modifier',
      icon: 'pencil',
      class: 'ghost',
      action: (u: Utilisateur) => this.editUser(u),
    },
    {
      label: 'Supprimer',
      icon: 'trash',
      class: 'danger',
      action: (u: Utilisateur) => this.openDeleteConfirm(u),
    },
  ];

  viewUser(user: Utilisateur): void {
    this.selectedUser.set(user);
    this.isUserDetailOpen.set(true);
  }

  closeUserDetails(): void {
    this.isUserDetailOpen.set(false);
    this.selectedUser.set(null);
  }

  editUser(user: Utilisateur): void {
    this.router.navigate(['/ajout-user', user.id]);
  }

  openDeleteConfirm(user: Utilisateur): void {
    this.selectedUserId = String(user.id);
    this.selectedUserName.set(user.nom || user.fullName || user.email || 'cet utilisateur');
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.selectedUserId = null;
    this.selectedUserName.set('');
  }

  confirmDelete(): void {
    if (!this.selectedUserId) return;

    this.isDeleting.set(true);
    this.api.deleteUser(this.selectedUserId).subscribe({
      next: (res: any) => {
        this.isDeleting.set(false);
        this.toast.success(res, 'Utilisateur supprimé avec succès');
        this.closeDeleteConfirm();
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error('Error deleting user:', err);
        this.toast.danger(err, 'Impossible de supprimer l\'utilisateur');
        this.closeDeleteConfirm();
      },
    });
  }
}
