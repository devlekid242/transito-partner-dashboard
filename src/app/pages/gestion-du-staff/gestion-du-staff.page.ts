import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormComponent, FormField } from '../../components/form/form.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-du-staff',
  templateUrl: './gestion-du-staff.page.html',
  styleUrls: ['./gestion-du-staff.page.css'],
  imports: [TableComponent, CommonModule, ModalComponent, FormComponent, NotificationComponent],
})
export class GestionDuStaffPage {
  // Données pour le tableau du personnel
  staffMembers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@transito.com',
      role: 'Admin',
      status: 'Active',
      phone: '+33 6 12 34 56 78',
    },
    {
      id: 2,
      name: 'Sarah Miller',
      email: 'sarah.m@transito.com',
      role: 'Manager',
      status: 'Active',
      phone: '+33 6 77 88 99 00',
    },
    {
      id: 3,
      name: 'Mike Williams',
      email: 'mike.williams@transito.com',
      role: 'Staff',
      status: 'Invited',
      phone: '',
    },
    {
      id: 4,
      name: 'Emma Johnson',
      email: 'emma.j@transito.com',
      role: 'Manager',
      status: 'Active',
      phone: '+33 6 55 44 33 22',
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.b@transito.com',
      role: 'Staff',
      status: 'Active',
      phone: '+33 6 99 00 11 22',
    },
  ];

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

  // Modal state
  isModalOpen = false;
  isFormModalOpen = false;
  selectedStaffMember: any = null;

  // Form state
  staffFormFields: FormField[] = [
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
      options: [
        { value: 'Admin', label: 'Admin' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Staff', label: 'Staff' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Invited', label: 'Invited' },
        { value: 'Inactive', label: 'Inactive' },
      ],
    },
  ];

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  editStaffMember(member: any): void {
    this.selectedStaffMember = { ...member };
    this.isFormModalOpen = true;
  }

  deactivateStaffMember(member: any): void {
    console.log('Deactivate staff member:', member);
    this.showToastNotification('warning', `Staff member ${member.name} deactivation requested`);
  }

  inviteNewUser(): void {
    this.selectedStaffMember = {
      id: null,
      name: '',
      email: '',
      role: 'Staff',
      status: 'Invited',
      phone: '',
    };
    this.isFormModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isFormModalOpen = false;
    this.selectedStaffMember = null;
  }

  onFormSubmit(formData: any): void {
    console.log('Form submitted:', formData);
    if (this.selectedStaffMember.id) {
      // Update existing member
      this.showToastNotification('success', `Staff member ${formData.name} updated successfully!`);
    } else {
      // Add new member
      this.showToastNotification('success', `Invitation sent to ${formData.email} successfully!`);
    }
    this.closeModal();
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  onSortChange(event: { key: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
    // Logique de tri à implémenter
  }

  // Role distribution data
  roleDistribution = [
    { role: 'Admin', count: 2, percentage: 20 },
    { role: 'Manager', count: 3, percentage: 30 },
    { role: 'Staff', count: 5, percentage: 50 },
  ];

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

}
