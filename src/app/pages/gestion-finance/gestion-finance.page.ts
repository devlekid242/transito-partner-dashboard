import { Component } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-finance',
  templateUrl: './gestion-finance.page.html',
  styleUrls: ['./gestion-finance.page.css'],
  imports: [RevenueChartComponent, CommonModule, TableComponent, ModalComponent, NotificationComponent],
})
export class GestionFinancePage {
  // Données pour le tableau des transactions
  transactions = [
    {
      date: '2023-10-27 14:30',
      type: 'Revenue (Route A)',
      amount: '+ 150,000',
      status: 'Completed',
    },
    { date: '2023-10-26 09:15', type: 'Payout', amount: '- 500,000', status: 'Pending' },
    { date: '2023-10-25 18:45', type: 'Fee (Platform)', amount: '- 15,000', status: 'Completed' },
    {
      date: '2023-10-24 11:20',
      type: 'Revenue (Route B)',
      amount: '+ 220,000',
      status: 'Completed',
    },
    {
      date: '2023-10-23 08:00',
      type: 'Revenue (Route C)',
      amount: '+ 180,000',
      status: 'Completed',
    },
  ];

  // Colonnes du tableau
  transactionColumns: TableColumn[] = [
    { key: 'date', title: 'Date', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'amount', title: 'Amount (XAF)', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ];

  // Actions du tableau
  transactionActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      action: (item) => this.viewTransactionDetails(item),
    },
    {
      icon: 'receipt',
      label: 'Generate Receipt',
      action: (item) => this.generateReceipt(item),
    },
  ];

  // Modal state
  isModalOpen = false;
  selectedTransaction: any = null;

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';

  viewTransactionDetails(transaction: any): void {
    this.selectedTransaction = transaction;
    this.isModalOpen = true;
  }

  generateReceipt(transaction: any): void {
    console.log('Generate receipt for:', transaction);
    this.showToastNotification('success', `Receipt generated for transaction on ${transaction.date}`);
  }

  requestPayout(): void {
    this.showToastNotification('info', 'Payout request initiated. Processing...');
    // Logique pour demander un paiement
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTransaction = null;
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
}
