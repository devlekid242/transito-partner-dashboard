import { Component, OnInit, signal } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { PartnerApiService } from '../../services/partner-api.service';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-rapport-analyse',
  templateUrl: './rapport-analyse.page.html',
  styleUrls: ['./rapport-analyse.page.css'],
  imports: [
    RevenueChartComponent,
    TableComponent,
    ModalComponent,
    NotificationComponent,
    CommonModule,
  ],
})
export class RapportAnalysePage implements OnInit {
  // Données pour le tableau d'activité récente
  recentActivity = signal<any[]>([]);

  // Colonnes du tableau des activités
  activityColumns = signal<TableColumn[]>([
    { key: 'id', title: 'ID' },
    { key: 'description', title: 'Description' },
    { key: 'amount', title: 'Montant' },
    { key: 'status', title: 'Statut' },
    { key: 'createdAt', title: 'Date' },
  ]);

  // Actions du tableau des activités
  activityActions = signal<TableAction[]>([
    {
      icon: 'download',
      label: 'Exporter',
      action: (item) => this.exportActivityData(item),
    },
  ]);

  // Données pour les rapports sauvegardés
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

  // Modal state
  isModalOpen = signal<boolean>(false);
  selectedActivity = signal<any>(null);

  dateRangeOptions = signal<{ value: string; label: string }[]>([]);
  selectedDateRange = signal<string>('30');
  reportCategoryOptions = signal<{ value: string; label: string }[]>([]);
  selectedReportCategory = signal<string>('all');

  reportChartLabels = signal<string[]>([]);
  reportChartData = signal<number[]>([]);
  reportChartType = signal<'line' | 'bar'>('line');
  reportChartOptions = signal<any>({
    plugins: { legend: { display: false } },
  });
  reportBreakdownLabels = signal<string[]>([]);
  reportBreakdownData = signal<number[]>([]);
  reportBreakdownChartType = signal<'line' | 'bar'>('bar');

  // Notification state
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
    this.partnerApiService.getPartnerStats().pipe(
      finalize(() => this.finishLoading())
    ).subscribe({
      next: (stats: any) => {
        if (stats) {
          this.metrics.set({
            revenue: {
              value: stats.revenue ?? this.metrics().revenue.value,
              change: stats.revenueChange ?? this.metrics().revenue.change,
              period: stats.revenuePeriod ?? this.metrics().revenue.period,
            },
            trips: {
              value: stats.activeTrips ?? this.metrics().trips.value,
              change: stats.tripChange ?? this.metrics().trips.change,
              period: stats.tripPeriod ?? this.metrics().trips.period,
            },
            occupancy: {
              value: stats.occupancy ?? this.metrics().occupancy.value,
              change: stats.occupancyChange ?? this.metrics().occupancy.change,
              period: stats.occupancyPeriod ?? this.metrics().occupancy.period,
            },
            incidents: {
              value: stats.incidentCount ?? this.metrics().incidents.value,
              change: stats.incidentChange ?? this.metrics().incidents.change,
              period: stats.incidentPeriod ?? this.metrics().incidents.period,
            },
          });

          if (Array.isArray(stats.recentTransactions) && stats.recentTransactions.length) {
            this.recentActivity.set(stats.recentTransactions);
          }

          this.reportChartLabels.set(stats.chartLabels ?? this.reportChartLabels());
          this.reportChartData.set(stats.chartData ?? this.reportChartData());
          this.reportBreakdownLabels.set(stats.breakdownLabels ?? this.reportBreakdownLabels());
          this.reportBreakdownData.set(stats.breakdownData ?? this.reportBreakdownData());
    this.updateReportChartData();
  }
      },
      error: (error) => {
        console.error('Error loading partner stats:', error);
        this.alertService.error('Erreur de chargement des rapports');
      },
    });
  }

  public loadSavedReports(): void {
    this.beginLoading();
    this.partnerApiService.getReports().pipe(
      finalize(() => this.finishLoading())
    ).subscribe({
      next: (reports) => {
        this.savedReports.set(reports);
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

  viewActivityDetails(activity: any): void {
    this.selectedActivity.set(activity);
    this.isModalOpen.set(true);
  }

  exportActivityData(activity: any): void {
    if (!activity) {
      return;
    }

    const csvRows = [
      ['ID', 'Description', 'Montant', 'Statut', 'Référence', 'Date'],
      [
        activity.id,
        activity.description,
        activity.amount,
        activity.status,
        activity.reference ?? '',
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
    this.showToastNotification('success', `Export de l'activité ${activity.id} lancé.`);
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
        this.showToastNotification('success', `Rapport généré et téléchargement lancé.`);
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.showToastNotification('error', 'Impossible de générer le rapport.');
      },
    });
}

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedActivity.set(null);
  }

  selectDateRange(value: string): void {
    this.selectedDateRange.set(value);
    this.updateReportChartData();
  }

  selectReportCategory(value: string): void {
    this.selectedReportCategory.set(value);
    this.updateReportChartData();
  }

  private updateReportChartData(): void {
    if (!this.reportChartData().length || !this.reportBreakdownData().length) {
      return;
    }

    if (this.selectedDateRange() === 'year') {
      this.reportChartLabels.set(['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']);
    } else if (this.selectedDateRange() === 'month') {
      this.reportChartLabels.set(['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
    } else if (this.selectedDateRange() === 'quarter') {
      this.reportChartLabels.set(['Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep']);
    } else {
      this.reportChartLabels.set(['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
    }
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotification.set(true);

    setTimeout(() => {
      this.showNotification.set(false);
    }, 5000);
  }

  // Metrics data
  metrics = signal({
    revenue: { value: '', change: '', period: '' },
    trips: { value: '', change: '', period: '' },
    occupancy: { value: '', change: '', period: '' },
    incidents: { value: '', change: '', period: '' },
  });
}

