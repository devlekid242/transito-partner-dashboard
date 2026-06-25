import { Component } from '@angular/core';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormComponent, FormField } from '../../components/form/form.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trip-schedule',
  templateUrl: './trip-schedule.page.html',
  styleUrls: ['./trip-schedule.page.css'],
  imports: [TableComponent, CommonModule, ModalComponent, FormComponent, NotificationComponent],
})
export class TripSchedulePage {
  // Données pour le tableau des départs
  todayDepartures = [
    {
      time: '08:00 AM',
      date: 'Oct 24, 2023',
      route: 'Douala → Yaoundé',
      bus: 'TR-842-X',
      status: 'Active',
    },
    {
      time: '10:30 AM',
      date: 'Oct 24, 2023',
      route: 'Yaoundé → Bafoussam',
      bus: 'TR-119-Y',
      status: 'Scheduled',
    },
    {
      time: '12:15 PM',
      date: 'Oct 24, 2023',
      route: 'Douala → Kribi',
      bus: 'TR-505-Z',
      status: 'Delayed',
    },
  ];

  upcomingTrips = [
    { id: '10h', time: '10:30 AM', route: 'YDE - BAF', bus: 'TR-119-Y', status: 'In 2h 15m' },
    { id: '12h', time: '12:15 PM', route: 'DLA - KBI', bus: 'TR-505-Z', status: 'In 4h 00m' },
  ];

  // Colonnes du tableau
  departureColumns: TableColumn[] = [
    { key: 'time', title: 'Time & Date', sortable: true },
    { key: 'route', title: 'Route', sortable: true },
    { key: 'bus', title: 'Assigned Bus', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ];

  upcomingColumns: TableColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'time', title: 'Time' },
    { key: 'route', title: 'Route' },
    { key: 'bus', title: 'Bus' },
    { key: 'status', title: 'Status' },
  ];

  // Actions du tableau
  departureActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      action: (item) => this.viewTripDetails(item),
    },
    {
      icon: 'edit',
      label: 'Manage',
      action: (item) => this.manageTrip(item),
    },
  ];

  // Modal state
  isModalOpen = false;
  isFormModalOpen = false;
  selectedTrip: any = null;

  // Form state
  tripFormFields: FormField[] = [
    {
      key: 'route',
      label: 'Route',
      type: 'text',
      required: true,
      placeholder: 'e.g. Douala → Yaoundé',
    },
    {
      key: 'bus',
      label: 'Assigned Bus',
      type: 'select',
      required: true,
      options: [
        { value: 'TR-842-X', label: 'TR-842-X (Volvo 9900)' },
        { value: 'TR-119-Y', label: 'TR-119-Y (Scania Touring)' },
        { value: 'TR-505-Z', label: 'TR-505-Z (Mercedes Tourismo)' },
      ],
    },
    {
      key: 'departureTime',
      label: 'Departure Time',
      type: 'text',
      required: true,
      placeholder: 'HH:MM',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Delayed', label: 'Delayed' },
        { value: 'Completed', label: 'Completed' },
      ],
    },
  ];

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  constructor() {}

  viewTripDetails(trip: any): void {
    this.selectedTrip = trip;
    this.isModalOpen = true;
  }

  manageTrip(trip: any): void {
    this.selectedTrip = trip;
    this.isFormModalOpen = true;
  }

  addNewTrip(): void {
    this.selectedTrip = {
      time: '',
      date: new Date().toISOString().split('T')[0],
      route: '',
      bus: '',
      status: 'Scheduled',
    };
    this.isFormModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isFormModalOpen = false;
    this.selectedTrip = null;
  }

  onFormSubmit(formData: any): void {
    console.log('Form submitted:', formData);
    this.showToatNotification('success', 'Trip updated successfully!');
    this.closeModal();
  }

  showToatNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
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
}
