import { Component, OnInit } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gestion-finance',
  templateUrl: './gestion-finance.page.html',
  styleUrls: ['./gestion-finance.page.css'],
  imports: [
    RevenueChartComponent,
    CommonModule,
    TableComponent,
    ModalComponent,
    NotificationComponent,
  ],
})
export class GestionFinancePage implements OnInit {
  // Données pour le tableau des transactions — démarrent vides et sont remplies par l'API
  transactions: any[] = [];

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

  transactionTypeOptions: { value: string; label: string }[] = [];
  selectedTransactionType = 'all';
  filteredTransactions: any[] = [];

  // Start empty — will be populated from the API when available
  financeChartLabels: string[] = [];
  financeChartData: number[] = [];
  financeBreakdownLabels: string[] = ['Revenue', 'Payout', 'Fee'];
  financeBreakdownData: number[] = [];
  financeChartType: 'line' | 'bar' = 'line';
  financeBreakdownChartType: 'line' | 'bar' = 'bar';
  financeChartOptions: any = {
    plugins: { legend: { display: false } },
  };

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isLoading = false;
  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.updateFilteredTransactions();
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoading = true;
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading = this.pendingLoadingRequests > 0;
  }

  ngOnInit() {
    this.partnerApiService.getTransactionTypeOptions().subscribe((options) => {
      this.transactionTypeOptions = options;
      if (!options.some((option) => option.value === this.selectedTransactionType)) {
        this.selectedTransactionType = options[0]?.value || this.selectedTransactionType;
      }
    });

    this.beginLoading();
    // Load dynamic finance data
    this.partnerApiService
      .getPartnerStats()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe((stats: any) => {
        if (stats?.recentTransactions) {
          this.transactions = stats.recentTransactions.map((t: any) => ({
            date: t.createdAt ?? '',
            type: t.description ?? 'Transaction',
            amount: (t.amount
              ? t.amount > 0
                ? `+ ${t.amount}`
                : `- ${Math.abs(t.amount)}`
              : '') as any,
            status: t.status ?? '',
          }));
          this.updateFilteredTransactions();
        }
        if (stats?.balance) {
          this.financeBreakdownData = [stats.balance.available ?? 0, stats.balance.pending ?? 0, 0];
          this.currentBalance = stats.totalRevenue ?? 0;
          this.availableForPayout = stats.balance?.available ?? 0;
        }
      });

    // Load revenue timeseries for the last 30 days
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = today.toISOString().slice(0, 10);
    this.beginLoading();
    this.partnerApiService
      .getRevenue(startStr, endStr)
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (r: any) => {
          if (r?.labels && r?.data) {
            this.financeChartLabels = r.labels;
            this.financeChartData = r.data;
          }
          if (r?.totalRevenue !== undefined) {
            this.currentBalance = r.totalRevenue;
          }
        },
        () => {
          this.alertService.error('Erreur de chargement du graphique financier');
        },
      );
  }

  // Current balance and available payout values (numbers)
  currentBalance: number = 0;
  availableForPayout: number = 0;

  private updateFilteredTransactions(): void {
    if (this.selectedTransactionType === 'all') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter((transaction) =>
        transaction.type.toLowerCase().includes(this.selectedTransactionType),
      );
    }
  }

  viewTransactionDetails(transaction: any): void {
    this.selectedTransaction = transaction;
    this.isModalOpen = true;
  }

  generateReceipt(transaction: any): void {
    // Try reservation receipt first, fallback to payment receipt
    const reservationId = transaction?.reservationId ?? transaction?.reservation?.id;
    const paymentId = transaction?.id;
    if (reservationId) {
      this.partnerApiService.getReservationReceipt(Number(reservationId)).subscribe(
        (blob) => this.downloadBlob(blob, `receipt_reservation_${reservationId}.pdf`),
        (err) => {
          console.error('Failed to download reservation receipt', err);
          this.showToastNotification('error', 'Impossible de télécharger le reçu.');
        },
      );
      return;
    }
    if (paymentId) {
      this.partnerApiService.getPaymentReceipt(Number(paymentId)).subscribe(
        (blob) => this.downloadBlob(blob, `receipt_payment_${paymentId}.pdf`),
        (err) => {
          console.error('Failed to download payment receipt', err);
          this.showToastNotification('error', 'Impossible de télécharger le reçu.');
        },
      );
      return;
    }

    this.showToastNotification(
      'info',
      'Aucun identifiant de réservation ou paiement trouvé pour ce transaction.',
    );
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  requestPayout(): void {
    // Redirect user to the withdrawal request page
    this.router.navigate(['/demande-de-retrait']);
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

  selectTransactionType(value: string | null): void {
    if (!value) {
      return;
    }
    this.selectedTransactionType = value;
    this.updateFilteredTransactions();
  }
}
