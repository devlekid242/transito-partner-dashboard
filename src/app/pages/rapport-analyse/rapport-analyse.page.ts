import { Component, OnInit, signal } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

interface MetricCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  tone: 'positive' | 'neutral' | 'warning' | 'danger';
}

interface StatusSummary {
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface BalanceSummary {
  label: string;
  value: string;
  subtitle: string;
  tone: 'positive' | 'neutral' | 'warning' | 'danger';
}

@Component({
  selector: 'app-rapport-analyse',
  templateUrl: './rapport-analyse.page.html',
  styleUrls: ['./rapport-analyse.page.css'],
  imports: [RevenueChartComponent, TableComponent, NotificationComponent, CommonModule],
})
export class RapportAnalysePage implements OnInit {
  recentActivity = signal<any[]>([]);

  transactionColumns = signal<TableColumn[]>([
    { key: 'description', title: 'Description' },
    { key: 'amount', title: 'Montant' },
    { key: 'status', title: 'Statut' },
    { key: 'createdAt', title: 'Date' },
  ]);
  transactionActions = signal<TableAction[]>([]);

  savedReports = signal<any[]>([]);

  reportColumns = signal<TableColumn[]>([
    { key: 'id', title: 'ID' },
    { key: 'title', title: 'Titre' },
    { key: 'type', title: 'Catégorie' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Statut' },
  ]);

  reportActions = signal<TableAction[]>([
    {
      icon: 'download',
      label: 'Télécharger',
      action: (item) => this.downloadReport(item),
    },
  ]);

  dateRangeOptions = signal<{ value: string; label: string }[]>([]);
  selectedDateRange = signal<string>('30');
  reportCategoryOptions = signal<{ value: string; label: string }[]>([]);
  selectedReportCategory = signal<string>('all');

  reportChartLabels = signal<string[]>([]);
  reportChartData = signal<number[]>([]);
  reportChartType = signal<'line' | 'bar'>('line');
  reportChartOptions = signal<any>({
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#334155',
          usePointStyle: false,
          padding: 16,
          font: { size: 12, weight: '600' },
        },
      },
    },
  });
  reportBreakdownLabels = signal<string[]>([]);
  reportBreakdownData = signal<number[]>([]);
  reportBreakdownChartType = signal<'line' | 'bar'>('bar');
  reportBreakdownChartOptions = signal<any>({
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#334155',
          padding: 16,
          font: { size: 12, weight: '600' },
        },
      },
    },
  });

  kpiCards = signal<MetricCard[]>([]);
  statusSummary = signal<StatusSummary[]>([]);
  balanceSummary = signal<BalanceSummary[]>([]);
  withdrawals = signal<any[]>([]);

  showNotification = signal<boolean>(false);
  notificationType = signal<'success' | 'error' | 'warning' | 'info'>('info');
  notificationMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private alertService: AlertService,
  ) {}

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoading.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading.set(this.pendingLoadingRequests > 0);
  }

  ngOnInit(): void {
    this.partnerApiService.getDateRangeOptions().subscribe({
      next: (options) => {
        this.dateRangeOptions.set(options);
        if (!options.some((option) => option.value === this.selectedDateRange())) {
          this.selectedDateRange.set(options[0]?.value || this.selectedDateRange());
        }
      },
      error: (error) => {
        console.error('Error loading date range options:', error);
        this.alertService.error('Erreur de chargement des options de plage de dates');
      },
    });

    this.partnerApiService.getReportCategoryOptions().subscribe({
      next: (options) => {
        this.reportCategoryOptions.set(options);
        if (!options.some((option) => option.value === this.selectedReportCategory())) {
          this.selectedReportCategory.set(options[0]?.value || this.selectedReportCategory());
        }
      },
      error: (error) => {
        console.error('Error loading report category options:', error);
        this.alertService.error('Erreur de chargement des options de catégorie de rapport');
      },
    });

    this.loadReportData();
    this.loadSavedReports();
  }

  private loadReportData(): void {
    this.beginLoading();
    this.partnerApiService
      .getPartnerStats()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (stats: any) => {
          if (!stats) {
            return;
          }

          console.log('Partner stats loaded:', stats);

          this.kpiCards.set(this.buildKpiCards(stats));
          this.recentActivity.set(
            Array.isArray(stats.recentTransactions) ? stats.recentTransactions : [],
          );
          this.withdrawals.set(Array.isArray(stats.withdrawals) ? stats.withdrawals : []);
          this.statusSummary.set(this.buildStatusSummary(stats.reservationsByStatus));
          this.balanceSummary.set(this.buildBalanceSummary(stats.balance));
          this.reportChartLabels.set(Array.isArray(stats.chartLabels) ? stats.chartLabels : []);
          this.reportChartData.set(Array.isArray(stats.chartData) ? stats.chartData : []);
          this.reportBreakdownLabels.set(
            this.normalizeBreakdownLabels(stats.breakdownLabels ?? []),
          );
          this.reportBreakdownData.set(
            Array.isArray(stats.breakdownData) ? stats.breakdownData : [],
          );
        },
        error: (error) => {
          console.error('Error loading partner stats:', error);
          this.alertService.error('Erreur de chargement des rapports');
        },
      });
  }

  public loadSavedReports(): void {
    this.beginLoading();
    this.partnerApiService
      .getReports()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (reports) => {
          this.savedReports.set(Array.isArray(reports) ? reports : []);
        },
        error: (error) => {
          console.error('Error loading saved reports:', error);
          this.alertService.error('Erreur de chargement des rapports sauvegardés');
        },
      });
  }

  get filteredReports(): any[] {
    if (this.selectedReportCategory() === 'all') {
      return this.savedReports();
    }
    return this.savedReports().filter((report) => report.type === this.selectedReportCategory());
  }

  exportActivityData(activity: any): void {
    if (!activity) {
      return;
    }

    const csvRows = [
      ['Description', 'Montant', 'Statut', 'Date'],
      [
        activity.description ?? '',
        activity.amount ?? '',
        activity.status ?? '',
        activity.createdAt ?? '',
      ],
    ];
    const csvContent = csvRows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `activity_${activity.id || 'export'}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    this.showToastNotification(
      'success',
      `Export de l'activité ${activity.id ?? 'sélectionnée'} lancé.`,
    );
  }

  downloadReport(report: any): void {
    if (!report?.id) {
      return;
    }

    this.partnerApiService.downloadReport(report.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = report.fileName || `rapport_${report.id}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.showToastNotification('success', `Téléchargement du rapport ${report.title} lancé.`);
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        this.showToastNotification('error', `Impossible de télécharger ${report.title}.`);
      },
    });
  }

  exportCurrentReport(): void {
    const payload = {
      category: this.selectedReportCategory(),
      dateRange: this.selectedDateRange(),
    };

    this.partnerApiService.generateReport(payload).subscribe({
      next: (blob) => {
        const fileName = `rapport_${payload.category}_${payload.dateRange}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.showToastNotification('success', 'Rapport généré et téléchargement lancé.');
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.showToastNotification('error', 'Impossible de générer le rapport.');
      },
    });
  }

  selectDateRange(value: string): void {
    this.selectedDateRange.set(value);
  }

  selectReportCategory(value: string): void {
    this.selectedReportCategory.set(value);
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotification.set(true);

    setTimeout(() => {
      this.showNotification.set(false);
    }, 5000);
  }

  formatCurrency(value: any): string {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatPercent(value: any): string {
    const amount = Number(value ?? 0);
    return `${amount.toFixed(0)}%`;
  }

  formatNumber(value: any): string {
    return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0));
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  getTransactionStatusClass(status: string): string {
    const normalized = String(status ?? '').toLowerCase();
    if (normalized.includes('termin')) {
      return 'badge-success';
    }
    if (
      normalized.includes('cours') ||
      normalized.includes('pending') ||
      normalized.includes('en cours')
    ) {
      return 'badge-warning';
    }
    return 'badge-neutral';
  }

  getReportTypeLabel(type: string): string {
    switch (type) {
      case 'financial':
        return 'Financier';
      case 'operational':
        return 'Opérationnel';
      case 'passenger':
        return 'Passagers';
      default:
        return type || 'Rapport';
    }
  }

  private buildKpiCards(stats: any): MetricCard[] {
    const totalReservations = this.sumReservations(stats.reservationsByStatus);

    return [
      {
        title: 'Revenu net',
        value: this.formatCurrency(stats.netRevenue ?? stats.revenue),
        subtitle: `${stats.revenueChange ?? '0%'} vs période précédente`,
        icon: 'payments',
        tone: 'positive',
      },
      {
        title: 'Frais plateforme',
        value: this.formatCurrency(stats.platformFees ?? 0),
        subtitle: 'Déduits du montant encaissé',
        icon: 'receipt_long',
        tone: 'neutral',
      },
      {
        title: 'Voyages actifs',
        value: this.formatNumber(stats.activeTrips ?? 0),
        subtitle: 'Trajets actuellement en cours',
        icon: 'route',
        tone: 'positive',
      },
      {
        title: 'Passagers actifs',
        value: this.formatNumber(stats.activePassengers ?? stats.totalPassengers ?? 0),
        subtitle: `${this.formatNumber(stats.totalPassengers ?? 0)} au total`,
        icon: 'groups',
        tone: 'neutral',
      },
      {
        title: 'Taux d’embarquement',
        value: this.formatPercent(stats.boardingRate ?? 0),
        subtitle: 'Réservations validées à bord',
        icon: 'how_to_reg',
        tone: 'positive',
      },
      {
        title: 'Réservations',
        value: this.formatNumber(totalReservations),
        subtitle: 'Vue consolidée des statuts',
        icon: 'confirmation_number',
        tone: 'neutral',
      },
    ];
  }

  private buildStatusSummary(reservationsByStatus: any): StatusSummary[] {
    const entries = Object.entries(reservationsByStatus ?? {}).map(([key, value]) => ({
      key,
      label: this.getStatusLabel(key),
      value: Number(value ?? 0),
    }));

    return entries
      .filter((entry) => entry.value > 0)
      .map((entry) => ({
        label: entry.label,
        value: entry.value,
        color: this.getStatusColor(entry.key),
        icon: this.getStatusIcon(entry.key),
      }))
      .sort((a, b) => b.value - a.value);
  }

  private buildBalanceSummary(balance: any): BalanceSummary[] {
    return [
      {
        label: 'Disponible',
        value: this.formatCurrency(balance?.available ?? 0),
        subtitle: 'Solde immédiatement utilisable',
        tone: 'positive',
      },
      {
        label: 'En attente',
        value: this.formatCurrency(balance?.pending ?? 0),
        subtitle: 'Fonds bloqués par retrait',
        tone: 'warning',
      },
      {
        label: 'À risque',
        value: this.formatCurrency(balance?.atRisk ?? 0),
        subtitle: 'Montant à surveiller',
        tone: 'danger',
      },
      {
        label: 'Transactions en attente',
        value: this.formatNumber(balance?.pendingTransactions ?? 0),
        subtitle: 'Mises à jour à venir',
        tone: 'neutral',
      },
    ];
  }

  private normalizeBreakdownLabels(labels: string[] = []): string[] {
    return labels.map((label) => this.translateBreakdownLabel(label));
  }

  private translateBreakdownLabel(label: string): string {
    const mapping: Record<string, string> = {
      REFUND_PENDING: 'En attente de remboursement',
      SUCCESS: 'Réussies',
      CANCELLED: 'Annulées',
      PENDING: 'En attente',
      CONFIRMED: 'Confirmées',
    };

    return mapping[label] ?? label;
  }

  private getStatusLabel(key: string): string {
    const mapping: Record<string, string> = {
      enAttentePaiement: 'En attente de paiement',
      confirmees: 'Confirmées',
      echouees: 'Échouées',
      annuleesRemboursementEnAttente: 'Annulées - remboursement en attente',
      annuleesRembourseesConfirmees: 'Annulées - remboursées',
      annuleesSansPaiementPrealable: 'Annulées sans paiement préalable',
    };

    return mapping[key] ?? key;
  }

  private getStatusColor(key: string): string {
    switch (key) {
      case 'confirmees':
        return 'text-success-green';
      case 'annuleesRemboursementEnAttente':
      case 'enAttentePaiement':
        return 'text-warning-gold';
      case 'echouees':
        return 'text-danger-red';
      default:
        return 'text-outline';
    }
  }

  private getStatusIcon(key: string): string {
    switch (key) {
      case 'confirmees':
        return 'check_circle';
      case 'annuleesRemboursementEnAttente':
      case 'enAttentePaiement':
        return 'pending';
      case 'echouees':
        return 'error';
      default:
        return 'receipt_long';
    }
  }

  private sumReservations(reservationsByStatus: any): number {
    return Object.values(reservationsByStatus ?? {}).reduce<number>((total, value) => {
      return total + Number(value ?? 0);
    }, 0);
  }
}
