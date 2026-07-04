import { Component, OnInit } from '@angular/core';
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
  recentActivity: any[] = [];

  // Colonnes du tableau des activités
  activityColumns: TableColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'description', title: 'Description' },
    { key: 'amount', title: 'Montant' },
    { key: 'status', title: 'Statut' },
    { key: 'createdAt', title: 'Date' },
  ];

  // Actions du tableau des activités
  activityActions: TableAction[] = [
    {
      icon: 'download',
      label: 'Exporter',
      action: (item) => this.exportActivityData(item),
    },
  ];

  // Données pour les rapports sauvegardés
  savedReports: any[] = [];

  reportColumns: TableColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'title', title: 'Titre' },
    { key: 'type', title: 'Catégorie' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Statut' },
  ];

  reportActions: TableAction[] = [
    {
      icon: 'download',
      label: 'Télécharger',
      action: (item) => this.downloadReport(item),
    },
  ];

  // Modal state
  isModalOpen = false;
  selectedActivity: any = null;

  dateRangeOptions: { value: string; label: string }[] = [];
  selectedDateRange = '30';
  reportCategoryOptions: { value: string; label: string }[] = [];
  selectedReportCategory = 'all';

  reportChartLabels: string[] = [];
  reportChartData: number[] = [];
  reportChartType: 'line' | 'bar' = 'line';
  reportChartOptions: any = {
    plugins: { legend: { display: false } },
  };
  reportBreakdownLabels: string[] = [];
  reportBreakdownData: number[] = [];
  reportBreakdownChartType: 'line' | 'bar' = 'bar';

  // Notification state
  showNotification = false;
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationMessage = '';
  isLoading = false;
  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    private alertService: AlertService,
  ) {}

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoading = true;
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoading = this.pendingLoadingRequests > 0;
  }

  ngOnInit(): void {
    this.partnerApiService.getDateRangeOptions().subscribe((options) => {
      this.dateRangeOptions = options;
      if (!options.some((option) => option.value === this.selectedDateRange)) {
        this.selectedDateRange = options[0]?.value || this.selectedDateRange;
      }
    });

    this.partnerApiService.getReportCategoryOptions().subscribe((options) => {
      this.reportCategoryOptions = options;
      if (!options.some((option) => option.value === this.selectedReportCategory)) {
        this.selectedReportCategory = options[0]?.value || this.selectedReportCategory;
      }
    });

    this.loadReportData();
    this.loadSavedReports();
  }

  private loadReportData(): void {
    this.beginLoading();
    this.partnerApiService
      .getPartnerStats()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (stats: any) => {
          if (stats) {
            this.metrics = {
              revenue: {
                value: stats.revenue ?? this.metrics.revenue.value,
                change: stats.revenueChange ?? this.metrics.revenue.change,
                period: stats.revenuePeriod ?? this.metrics.revenue.period,
              },
              trips: {
                value: stats.activeTrips ?? this.metrics.trips.value,
                change: stats.tripChange ?? this.metrics.trips.change,
                period: stats.tripPeriod ?? this.metrics.trips.period,
              },
              occupancy: {
                value: stats.occupancy ?? this.metrics.occupancy.value,
                change: stats.occupancyChange ?? this.metrics.occupancy.change,
                period: stats.occupancyPeriod ?? this.metrics.occupancy.period,
              },
              incidents: {
                value: stats.incidentCount ?? this.metrics.incidents.value,
                change: stats.incidentChange ?? this.metrics.incidents.change,
                period: stats.incidentPeriod ?? this.metrics.incidents.period,
              },
            };

            if (Array.isArray(stats.recentTransactions) && stats.recentTransactions.length) {
              this.recentActivity = stats.recentTransactions;
            }

            this.reportChartLabels = stats.chartLabels ?? this.reportChartLabels;
            this.reportChartData = stats.chartData ?? this.reportChartData;
            this.reportBreakdownLabels = stats.breakdownLabels ?? this.reportBreakdownLabels;
            this.reportBreakdownData = stats.breakdownData ?? this.reportBreakdownData;
            this.updateReportChartData();
          }
        },
        () => {
          this.alertService.error('Erreur de chargement des rapports');
        },
      );
  }

  public loadSavedReports(): void {
    this.beginLoading();
    this.partnerApiService
      .getReports()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (reports) => {
          this.savedReports = reports;
        },
        (error) => {
          console.error('Error loading saved reports:', error);
          this.alertService.error('Erreur de chargement des rapports sauvegardés');
        },
      );
  }

  get filteredReports(): any[] {
    if (this.selectedReportCategory === 'all') {
      return this.savedReports;
    }
    return this.savedReports.filter((report) => report.type === this.selectedReportCategory);
  }

  viewActivityDetails(activity: any): void {
    this.selectedActivity = activity;
    this.isModalOpen = true;
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

    this.partnerApiService.downloadReport(report.id).subscribe(
      (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = report.fileName || `rapport_${report.id}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.showToastNotification('success', `Téléchargement du rapport ${report.title} lancé.`);
      },
      (error) => {
        console.error('Error downloading report:', error);
        this.showToastNotification('error', `Impossible de télécharger ${report.title}.`);
      },
    );
  }

  exportCurrentReport(): void {
    const payload = {
      category: this.selectedReportCategory,
      dateRange: this.selectedDateRange,
    };

    this.partnerApiService.generateReport(payload).subscribe(
      (blob) => {
        const fileName = `rapport_${payload.category}_${payload.dateRange}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.showToastNotification('success', `Rapport généré et téléchargement lancé.`);
      },
      (error) => {
        console.error('Error generating report:', error);
        this.showToastNotification('error', 'Impossible de générer le rapport.');
      },
    );
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedActivity = null;
  }

  selectDateRange(value: string): void {
    this.selectedDateRange = value;
    this.updateReportChartData();
  }

  selectReportCategory(value: string): void {
    this.selectedReportCategory = value;
    this.updateReportChartData();
  }

  private updateReportChartData(): void {
    if (!this.reportChartData.length || !this.reportBreakdownData.length) {
      return;
    }

    if (this.selectedDateRange === 'year') {
      this.reportChartLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    } else if (this.selectedDateRange === 'month') {
      this.reportChartLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    } else if (this.selectedDateRange === 'quarter') {
      this.reportChartLabels = ['Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep'];
    } else {
      this.reportChartLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    }
  }

  showToastNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.notificationType = type;
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  // Metrics data
  metrics = {
    revenue: { value: '', change: '', period: '' },
    trips: { value: '', change: '', period: '' },
    occupancy: { value: '', change: '', period: '' },
    incidents: { value: '', change: '', period: '' },
  };
}
