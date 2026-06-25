import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormComponent, FormField } from '../../components/form/form.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-point-embarquement',
  templateUrl: './gestion-point-embarquement.page.html',
  styleUrls: ['./gestion-point-embarquement.page.css'],
  imports: [TableComponent, ModalComponent, FormComponent, NotificationComponent, CommonModule],
})
export class GestionPointEmbarquementPage {
  // Données pour le tableau des points de vente
  salesPoints = [
    {
      id: 1,
      name: 'Gare Centrale - Yaoundé',
      type: 'Agence Principale',
      address: 'Bvd du 20 Mai, Yaoundé, Cameroun',
      phone: '+237 6 99 00 11 22',
      manager: 'Jean Dupont',
      status: 'Ouvert',
      dailySales: 145,
    },
    {
      id: 2,
      name: 'Akwa Douala - VIP',
      type: 'Kiosque Premium',
      address: 'Rue Sylvani, Akwa, Douala',
      phone: '+237 6 77 88 99 00',
      manager: 'Marie Kamga',
      status: 'Ouvert',
      dailySales: 89,
    },
    {
      id: 3,
      name: 'Bafoussam Centre',
      type: 'Guichet Express',
      address: 'Marché A, Bafoussam',
      phone: '+237 6 55 44 33 22',
      manager: 'Paul Etoga',
      status: 'Fermé',
      dailySales: 0,
    },
    {
      id: 4,
      name: "Gare Nord - N'Djamena",
      type: 'Agence Transfrontalière',
      address: "Avenue Charles de Gaulle, N'Djamena",
      phone: '+235 66 77 88 99',
      manager: 'Ahmat Saleh',
      status: 'Maintenance',
      dailySales: 12,
    },
  ];

  // Colonnes du tableau
  salesPointColumns: TableColumn[] = [
    { key: 'name', title: 'Nom', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'address', title: 'Adresse' },
    { key: 'phone', title: 'Téléphone' },
    { key: 'status', title: 'Statut', sortable: true },
  ];

  // Actions du tableau
  salesPointActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewSalesPointDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editSalesPoint(item),
    },
    {
      icon: 'delete',
      label: 'Supprimer',
      action: (item) => this.deleteSalesPoint(item),
    },
  ];

  // Form fields for adding/editing sales point
  salesPointFormFields: FormField[] = [
    {
      key: 'name',
      label: 'Nom du Point de Vente',
      type: 'text',
      required: true,
      placeholder: 'Ex: Agence Centrale Douala',
    },
    {
      key: 'address',
      label: 'Emplacement / Adresse',
      type: 'text',
      required: true,
      placeholder: 'Adresse complète ou repère',
    },
    {
      key: 'phone',
      label: 'Téléphone de Contact',
      type: 'tel',
      required: true,
      placeholder: '+237 XXXXXXXX',
    },
    {
      key: 'manager',
      label: 'Gestionnaire Assigné',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Jean Dupont' },
        { value: '2', label: 'Marie Curie' },
        { value: '3', label: 'Paul Atreides' },
      ],
    },
    {
      key: 'type',
      label: 'Type de Point',
      type: 'select',
      required: true,
      options: [
        { value: 'principal', label: 'Agence Principale' },
        { value: 'premium', label: 'Kiosque Premium' },
        { value: 'express', label: 'Guichet Express' },
        { value: 'crossborder', label: 'Agence Transfrontalière' },
      ],
    },
  ];

  // Modal state
  isModalOpen = false;
  isFormModalOpen = false;
  selectedSalesPoint: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  viewSalesPointDetails(point: any): void {
    this.selectedSalesPoint = point;
    this.isModalOpen = true;
  }

  editSalesPoint(point: any): void {
    this.selectedSalesPoint = { ...point };
    this.isFormModalOpen = true;
  }

  addNewSalesPoint(): void {
    this.selectedSalesPoint = {
      id: null,
      name: '',
      type: 'express',
      address: '',
      phone: '',
      manager: '1',
      status: 'Ouvert',
      dailySales: 0,
    };
    this.isFormModalOpen = true;
  }

  deleteSalesPoint(point: any): void {
    console.log('Delete sales point:', point.id);
    this.showToastNotification('warning', `Point de vente ${point.name} marqué pour suppression`);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isFormModalOpen = false;
    this.selectedSalesPoint = null;
  }

  onFormSubmit(formData: any): void {
    console.log('Sales point form submitted:', formData);
    if (this.selectedSalesPoint.id) {
      // Update existing point
      this.showToastNotification(
        'success',
        `Point de vente ${formData.name} mis à jour avec succès!`,
      );
    } else {
      // Add new point
      this.showToastNotification(
        'success',
        `Nouveau point de vente ${formData.name} ajouté avec succès!`,
      );

      // Add to the list
      const newId = Math.max(...this.salesPoints.map((p) => p.id)) + 1;
      this.salesPoints.push({
        id: newId,
        ...formData,
        status: 'Ouvert',
        dailySales: 0,
      });
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

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Ouvert':
        return 'bg-[#e6f4ea] text-success-green border-[#cce8d6]';
      case 'Fermé':
        return 'bg-error-container text-danger-red border-[#f5c6c6]';
      case 'Maintenance':
        return 'bg-[#fff9e6] text-tertiary-container border-[#fce8b2]';
      default:
        return 'bg-surface-container text-on-surface border-border-subtle';
    }
  }
}
