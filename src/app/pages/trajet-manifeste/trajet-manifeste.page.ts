import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trajet-manifeste',
  templateUrl: './trajet-manifeste.page.html',
  styleUrls: ['./trajet-manifeste.page.css'],
  imports: [TableComponent, ModalComponent, NotificationComponent, CommonModule],
})
export class TrajetManifestePage {
  // Trip information
  tripInfo = {
    id: 'TRP-8492-X',
    route: 'Douala → Yaoundé',
    date: '14 Nov 2023, 08:00',
    status: 'EN COURS',
    bus: {
      plate: 'CE 492 LT',
      model: 'VIP Express',
      capacity: 50,
      occupied: 42,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAB9PnIu9alG0SPCfdWzOgwyIurvVs62CncRbg4-frk2K1eUfmxP86djK63xaGp3TBV_5eAliqI3aHcSuDOGEZq6dtF4TpD_2Nw1V1NcFZQD05FGInUCmEWNZxlHlxlDdqrf0DcfDzPJzHT0x-vKBKYTRl61z9rKxCJQJGTVEbhCGaMpr_YTZonaSQKrxzhL48fl3CW0LpSaPVIE7fFS-BOpQHV5pWrME92beMKsTaUMUYwqSuyl5JDyb994bFU_LHyGHJQ85QO3pQ85ctGyCBqRx-P5GvA9uHnPkBd2IzL2Sd2CHQvR1AbCtC_5NvV0',
    },
    driver: {
      name: 'Marc Oumarou',
      license: 'D',
      experience: '12 ans',
    },
    hostess: {
      name: 'Sarah Eboa',
    },
  };

  // Passenger data
  passengers = [
    {
      id: 1,
      seat: '01',
      name: 'Alain Mvondo',
      phone: '+237 6XX XX XX XX',
      ticket: 'TKT-88392',
      status: 'Embarqué',
    },
    {
      id: 2,
      seat: '02',
      name: 'Marie Ngo',
      phone: '+237 6XX XX XX XX',
      ticket: 'TKT-88393',
      status: 'Embarqué',
    },
    {
      id: 3,
      seat: '03',
      name: 'Paul Biya (Jr)',
      phone: '+237 6XX XX XX XX',
      ticket: 'TKT-88401',
      status: 'En attente',
    },
    {
      id: 4,
      seat: '04',
      name: 'Jeanne Kamga',
      phone: '+237 6XX XX XX XX',
      ticket: 'TKT-88405',
      status: 'Embarqué',
    },
    {
      id: 5,
      seat: '05',
      name: 'Luc Tchuente',
      phone: '+237 6XX XX XX XX',
      ticket: 'TKT-88410',
      status: 'Annulé',
    },
  ];

  // Table columns
  passengerColumns: TableColumn[] = [
    { key: 'seat', title: 'Siège' },
    { key: 'name', title: 'Passager' },
    { key: 'ticket', title: 'N° Billet' },
    { key: 'status', title: 'Statut' },
  ];

  // Table actions
  passengerActions: TableAction[] = [
    {
      icon: 'check',
      label: 'Valider',
      action: (item) => this.validatePassenger(item),
    },
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewPassengerDetails(item),
    },
  ];

  // Modal state
  isModalOpen = false;
  selectedPassenger: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  validatePassenger(passenger: any): void {
    passenger.status = 'Embarqué';
    this.showToastNotification('success', `Passager ${passenger.name} validé avec succès`);
  }

  viewPassengerDetails(passenger: any): void {
    this.selectedPassenger = passenger;
    this.isModalOpen = true;
  }

  printManifest(): void {
    this.showToastNotification('info', 'Impression du manifeste en cours...');
    // Logique d'impression
  }

  scanTicket(): void {
    this.showToastNotification('info', 'Scanner de billet activé');
    // Logique de scan
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPassenger = null;
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  // Trip progress data
  tripProgress = [
    {
      location: 'Douala (Agence Akwa)',
      time: '08:00',
      status: 'Départ: 08:00 (Effectif)',
      completed: true,
    },
    {
      location: 'Edéa (Escale)',
      time: '09:30',
      status: 'Prévu: 09:30 (En approche)',
      completed: false,
      current: true,
    },
    {
      location: 'Yaoundé (Mvan)',
      time: '12:45',
      status: 'Arrivée estimée: 12:45',
      completed: false,
    },
  ];
}
