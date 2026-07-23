import { Component, OnInit } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerApiService } from '../../services/partner-api.service';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-ajout-user',
  templateUrl: './ajout-user.page.html',
  styleUrls: ['./ajout-user.page.css'],
  standalone: true,
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule, FormsModule],
})
export class AjoutUserPage {
  // Form fields for user invitation
  userFormFields: FormField[] = [
    {
      key: 'fullName',
      label: 'Nom Complet',
      type: 'text',
      required: true,
      placeholder: 'Nom et prénom',
    },
    {
      key: 'email',
      label: 'Adresse Email',
      type: 'email',
      required: true,
      placeholder: 'nom@entreprise.com',
    },
    {
      key: 'phoneNumber',
      label: 'Numéro de Téléphone',
      type: 'tel',
      required: true,
      placeholder: '+237 6XX XXX XXX',
    },
    {
      key: 'ville',
      label: 'Ville de Résidence',
      type: 'text',
      required: true,
      placeholder: 'Ex: Douala',
    },
    {
      key: 'quartier',
      label: 'Quartier',
      type: 'text',
      required: true,
      placeholder: 'Ex: Akwa',
    },
    {
      key: 'password',
      label: 'Mot de passe (optionnel)',
      type: 'password',
      required: false,
      placeholder: 'Laisser vide pour générer automatiquement',
    },
  ];

  // Recent invitations data
  recentInvitations = [];

  // Table columns for recent invitations
  invitationColumns: TableColumn[] = [
    { key: 'name', title: 'User' },
    { key: 'email', title: 'Email' },
    { key: 'status', title: 'Status' },
  ];

  // Table actions
  invitationActions: TableAction[] = [
    {
      icon: 'refresh',
      label: 'Resend Invite',
      action: (item) => this.resendInvite(item),
    },
    {
      icon: 'close',
      label: 'Cancel Invite',
      action: (item) => this.cancelInvite(item),
    },
  ];

  // Selected role
  selectedRole: 'agent_admin' | 'agent_quai' = 'agent_admin';

  // Form model
  fullName = '';
  email = '';
  phoneNumber = '';
  ville = '';
  quartier = '';
  password = '';
  createAsAgent = false;
  agentRole: 'agent_quai' | 'admin_agence' = 'agent_quai';
  selectedAgencyId: number | null = null;
  agencies: any[] = [];

  // Role options
  roleOptions: any[] = [];

  // Permissions state
  permissions = {
    fleetManagement: true,
    financialAccess: false,
    reportsAnalytics: true,
  };

  // Modal state
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isSubmitting = false;

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.partnerApiService.getRoleOptions().subscribe((options) => {
      this.roleOptions = options;
    });

    // load agencies for agent assignment
    this.partnerApiService.getAgencies().subscribe((list) => {
      this.agencies = Array.isArray(list) ? list : [];
    });
  }

  onFormSubmit(formData: any): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Build payload for backend register endpoint
    const payload: any = {
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      ville: this.ville,
      quartier: this.quartier,
      password: this.password || undefined,
      agentRole: this.agentRole
      
    };

    this.partnerApiService.registerUser(payload).subscribe(
      (res) => {
        this.isSubmitting = false;
        this.alertService.success(`Utilisateur ${payload.fullName} créé.`);
        this.router.navigate(['/gestion-du-staff']).catch(() => {});
      },
      (err) => {
        this.isSubmitting = false;
        console.error('Registration error', err);
        this.alertService.error("Impossible de créer l'utilisateur.");
      },
    );
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'staff':
        return 'Staff';
      default:
        return 'Staff';
    }
  }

  setRole(role: string): void {
    const normalizedRole =
      role === 'agent_admin' || role === 'agent_quai' ? role : 'agent_quai';
    this.selectedRole = normalizedRole;
    // Update permissions based on role
    this.updatePermissionsForRole(normalizedRole);
  }

  updatePermissionsForRole(role: any): void {
    switch (role) {
      case 'admin':
        this.permissions = {
          fleetManagement: true,
          financialAccess: true,
          reportsAnalytics: true,
        };
        break;
      case 'staff':
        this.permissions = {
          fleetManagement: false,
          financialAccess: false,
          reportsAnalytics: false,
        };
        break;
    }
  }

  resendInvite(invitation: any): void {
    console.log('Resend invite to:', invitation.email);
    this.showToastNotification('info', `Invitation resent to ${invitation.email}`);
  }

  cancelInvite(invitation: any): void {
    console.log('Cancel invite for:', invitation.email);
    this.recentInvitations = this.recentInvitations.filter((inv :any ) => inv.id !== invitation.id);
    this.showToastNotification('warning', `Invitation for ${invitation.email} has been cancelled`);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  openModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
