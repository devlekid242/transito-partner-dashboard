import { Component, OnInit, signal } from '@angular/core';
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
  transactions = signal<any[]>([]);

  // Colonnes du tableau
  transactionColumns = signal<TableColumn[]>([
    { key: 'date', title: 'Date', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    { key: 'amount', title: 'Amount (XAF)', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ]);

  // Actions du tableau
  transactionActions = signal<TableAction[]>([
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
  ]);

  // Modal state
  isModalOpen = signal<boolean>(false);
  selectedTransaction = signal<any>(null);

  transactionTypeOptions = signal<{ value: string; label: string }[]>([]);
  selectedTransactionType = signal<string>('all');
  filteredTransactions = signal<any[]>([]);

  // Start empty — will be populated from the API when available
  financeChartLabels = signal<string[]>([]);
  financeChartData = signal<number[]>([]);
  financeBreakdownLabels = signal<string[]>(['Revenue', 'Payout', 'Fee']);
  financeBreakdownData = signal<number[]>([]);
  financeChartType = signal<'line' | 'bar'>('line');
  financeBreakdownChartType = signal<'line' | 'bar'>('bar');
  financeChartOptions = signal<any>({
    plugins: { legend: { display: false } },
  });
  // Notification state
  showNotification = signal<boolean>(false);
  notificationType = signal<'success' | 'error' | 'warning' | 'info'>('info');
  notificationMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  private pendingLoadingRequests = 0;

  // Current balance and available payout values (numbers)
  currentBalance = signal<number>(0);
  availableForPayout = signal<number>(0);

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
    private alertService: AlertService,
  ) {
    this.updateFilteredTransactions();
  }

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoading.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading.set(this.pendingLoadingRequests > 0);
  }

  ngOnInit() {
    this.partnerApiService.getTransactionTypeOptions().subscribe({
      next: (options) => {
        this.transactionTypeOptions.set(options);
        if (!options.some((option) => option.value === this.selectedTransactionType())) {
          this.selectedTransactionType.set(options[0]?.value || this.selectedTransactionType());
        }
      },
      error: (error) => {
        console.error('Error loading transaction type options:', error);
        this.alertService.error('Erreur de chargement des types de transactions');
      },
    });

    this.beginLoading();
    // Load dynamic finance data
    this.partnerApiService
      .getPartnerStats()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (stats: any) => {
          if (stats?.recentTransactions) {
            this.transactions.set(
              stats.recentTransactions.map((t: any) => ({
                date: t.createdAt ?? '',
                type: t.description ?? 'Transaction',
                amount: (t.amount
                  ? t.amount > 0
                    ? `+ ${t.amount}`
                    : `- ${Math.abs(t.amount)}`
                  : '') as any,
                status: t.status ?? '',
              })),
            );
            this.updateFilteredTransactions();
          }
          if (stats?.balance) {
            this.financeBreakdownData.set([
              stats.balance.available ?? 0,
              stats.balance.pending ?? 0,
              stats.platformFees ?? 0,
            ]);
            this.currentBalance.set(stats.netRevenue ?? stats.revenue ?? 0);
            this.availableForPayout.set(stats.balance?.available ?? 0);
          }
        },
        error: (error) => {
          console.error('Error loading partner stats:', error);
          this.alertService.error('Erreur de chargement des statistiques financières');
        },
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
      .subscribe({
        next: (r: any) => {
          if (r?.labels && r?.data) {
            this.financeChartLabels.set(r.labels);
            this.financeChartData.set(r.data);
          }
        },
        error: (error) => {
          console.error('Error loading revenue data:', error);
          this.alertService.error('Erreur de chargement du graphique financier');
        },
      });
  }

  private updateFilteredTransactions(): void {
    if (this.selectedTransactionType() === 'all') {
      this.filteredTransactions.set([...this.transactions()]);
    } else {
      this.filteredTransactions.set(
        this.transactions().filter((transaction) =>
          transaction.type.toLowerCase().includes(this.selectedTransactionType()),
        ),
      );
    }
  }

  viewTransactionDetails(transaction: any): void {
    this.selectedTransaction.set(transaction);
    this.isModalOpen.set(true);
  }

  generateReceipt(transaction: any): void {
    // Try reservation receipt first, fallback to payment receipt
    const reservationId = transaction?.reservationId ?? transaction?.reservation?.id;
    const paymentId = transaction?.id;
    if (reservationId) {
      this.partnerApiService.getReservationReceipt(Number(reservationId)).subscribe({
        next: (blob) => this.downloadBlob(blob, `receipt_reservation_${reservationId}.pdf`),
        error: (err) => {
          console.error('Failed to download reservation receipt', err);
          this.showToastNotification('error', 'Impossible de télécharger le reçu.');
        },
      });
      return;
    }
    if (paymentId) {
      this.partnerApiService.getPaymentReceipt(Number(paymentId)).subscribe({
        next: (blob) => this.downloadBlob(blob, `receipt_payment_${paymentId}.pdf`),
        error: (err) => {
          console.error('Failed to download payment receipt', err);
          this.showToastNotification('error', 'Impossible de télécharger le reçu.');
        },
      });
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
    this.isModalOpen.set(false);
    this.selectedTransaction.set(null);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotification.set(true);

    setTimeout(() => {
      this.showNotification.set(false);
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
    this.selectedTransactionType.set(value);
    this.updateFilteredTransactions();
  }
}
