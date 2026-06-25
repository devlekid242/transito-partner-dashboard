import { Component } from '@angular/core';
import { FormComponent, FormField } from '../../components/form/form.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ajout-user',
  templateUrl: './ajout-user.page.html',
  styleUrls: ['./ajout-user.page.css'],
  imports: [ TableComponent, ModalComponent, NotificationComponent, CommonModule, FormsModule],
})
export class AjoutUserPage {
  // Form fields for user invitation
  userFormFields: FormField[] = [
    {
      key: 'email',
      label: 'Adresse Email',
      type: 'email',
      required: true,
      placeholder: 'nom@entreprise.com',
    },
    {
      key: 'phone',
      label: 'Numéro de Téléphone',
      type: 'tel',
      required: false,
      placeholder: '+237 6XX XXX XXX',
    },
  ];

  // Recent invitations data
  recentInvitations = [
    {
      id: 1,
      name: 'Marc J.',
      email: 'marc.j@example.com',
      status: 'Pending',
      role: 'Manager',
      invitedDate: '2023-10-20',
    },
    {
      id: 2,
      name: 'Sarah L.',
      email: 's.leclerc@example.com',
      status: 'Accepted',
      role: 'Staff',
      invitedDate: '2023-10-18',
    },
  ];

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
  selectedRole: 'admin' | 'manager' | 'staff' = 'manager';

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

  constructor() {}

  onFormSubmit(formData: any): void {
    console.log('Form submitted:', formData);
    this.showToastNotification('success', `Invitation sent to ${formData.email} successfully!`);

    // Add to recent invitations
    this.recentInvitations.unshift({
      id: this.recentInvitations.length + 1,
      name: formData.email.split('@')[0],
      email: formData.email,
      status: 'Pending',
      role: this.getRoleLabel(this.selectedRole),
      invitedDate: new Date().toISOString().split('T')[0],
    });
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

  setRole(role: 'admin' | 'manager' | 'staff'): void {
    this.selectedRole = role;
    // Update permissions based on role
    this.updatePermissionsForRole(role);
  }

  updatePermissionsForRole(role: 'admin' | 'manager' | 'staff'): void {
    switch (role) {
      case 'admin':
        this.permissions = {
          fleetManagement: true,
          financialAccess: true,
          reportsAnalytics: true,
        };
        break;
      case 'manager':
        this.permissions = {
          fleetManagement: true,
          financialAccess: false,
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
    this.recentInvitations = this.recentInvitations.filter((inv) => inv.id !== invitation.id);
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
