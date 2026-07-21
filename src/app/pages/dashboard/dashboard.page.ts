import { Component, OnInit, signal, computed } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { NotificationComponent } from '../../components/notification/notification.component';
import { ChartType } from 'chart.js/auto';
import { PartnerApiService } from '../../services/partner-api.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  imports: [RevenueChartComponent, TableComponent, NotificationComponent, CommonModule],
})
export class DashboardPage implements OnInit {
  // Données pour le tableau des départs à venir
  private readonly upcomingTripsSignal = signal<any[]>([]);
  upcomingTrips = computed(() => this.upcomingTripsSignal());

  // Notification état
  private readonly showNotificationSignal = signal<boolean>(false);
  showNotification = computed(() => this.showNotificationSignal());

  private readonly notificationTypeSignal = signal<'success' | 'error' | 'warning' | 'info'>(
    'info',
  );
  notificationType = computed(() => this.notificationTypeSignal());

  private readonly notificationMessageSignal = signal<string>(
    'Nouvelle réservation reçue pour le trajet Douala-Yaoundé',
  );
  notificationMessage = computed(() => this.notificationMessageSignal());

  // Revenue range
  private readonly selectedRevenueRangeSignal = signal<string>('30');
  selectedRevenueRange = computed(() => this.selectedRevenueRangeSignal());

  private readonly revenueRangeOptionsSignal = signal<any[]>([
    { value: '30', label: '30 derniers jours' },
    { value: '7', label: '7 derniers jours' },
    { value: 'year', label: 'Cette année' },
  ]);
  revenueRangeOptions = computed(() => this.revenueRangeOptionsSignal());

  // Revenue chart data
  private readonly revenueChartLabelsSignal = signal<string[]>([]);
  revenueChartLabels = computed(() => this.revenueChartLabelsSignal());

  private readonly revenueChartDataSignal = signal<number[]>([]);
  revenueChartData = computed(() => this.revenueChartDataSignal());

  private readonly revenueChartTypeSignal = signal<ChartType>('line');
  revenueChartType = computed(() => this.revenueChartTypeSignal());

  revenueChartOptions: any = {
    plugins: { legend: { display: false } },
  };

  // Metrics data
  private readonly metricsSignal = signal({
    revenue: { value: '0', currency: 'XAF', change: '0%' },
    activeTrips: { value: '0', routes: '0 itinéraires' },
    totalPassengers: { value: '0', description: "Manifestés aujourd'hui" },
  });
  metrics = computed(() => this.metricsSignal());

  // Recent activity data
  private readonly recentActivitySignal = signal<any[]>([]);
  recentActivity = computed(() => this.recentActivitySignal());

  private readonly isLoadingSignal = signal<boolean>(false);
  isLoading = computed(() => this.isLoadingSignal());

  // Colonnes du tableau
  tripColumns: TableColumn[] = [
    { key: 'id', title: 'Bus ID' },
    { key: 'route', title: 'Itinéraire' },
    { key: 'date', title: 'Date' },
    { key: 'time', title: 'Heure' },
    { key: 'status', title: 'Statut' },
  ];

  // Actions du tableau
  tripActions: TableAction[] = [
    {
      icon: 'visibility',
      label: 'Voir détails',
      action: (item) => this.viewTripDetails(item),
    },
    {
      icon: 'edit',
      label: 'Modifier',
      action: (item) => this.editTrip(item),
    },
  ];

  private pendingLoadingRequests = 0;

  constructor(
    private partnerApiService: PartnerApiService,
    public authService: AuthService,
    private alertService: AlertService,
    private route: Router
  ) {}

  private beginLoading(): void {
    this.pendingLoadingRequests += 1;
    this.isLoadingSignal.set(true);
  }

  private finishLoading(): void {
    this.pendingLoadingRequests = Math.max(0, this.pendingLoadingRequests - 1);
    this.isLoadingSignal.set(this.pendingLoadingRequests > 0);
  }

  ngOnInit() {
    this.partnerApiService.getDateRangeOptions().subscribe((options) => {
      this.revenueRangeOptionsSignal.set(options);
      if (!options.some((option) => option.value === this.selectedRevenueRangeSignal())) {
        this.selectedRevenueRangeSignal.set(options[0]?.value || this.selectedRevenueRangeSignal());
      }
    });

    this.loadDashboardData();
    this.loadRecentActivity();
    this.updateRevenueChartData('30');
  }

  selectRevenueRange(value: string | null): void {
    if (!value) {
      return;
    }
    this.selectedRevenueRangeSignal.set(value);
    this.updateRevenueChartData(value);
  }

  private updateRevenueChartData(range: string): void {
    this.beginLoading();
    if (range === '7') {
      this.revenueChartTypeSignal.set('bar');
    } else {
      this.revenueChartTypeSignal.set('line');
    }

    this.partnerApiService
      .getRevenue(this.getStartDate(range), this.getEndDate(range))
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (revenueData: any) => {
          if (revenueData) {
            this.revenueChartLabelsSignal.set(revenueData.labels ?? []);
            this.revenueChartDataSignal.set(revenueData.data ?? []);
            const m = this.metricsSignal();
            m.revenue.value = this.formatCurrency(revenueData.totalRevenue ?? 0);
            m.revenue.change = revenueData.change ?? m.revenue.change;
            this.metricsSignal.set(m);
          }
        },
        error: (error) => {
          this.finishLoading();
          console.error('Error loading revenue chart data:', error);
          this.alertService.error('Erreur de chargement du graphique des revenus');
        },
      });
  }

  private getStartDate(range: string): string {
    const today = new Date();
    if (range === '7') {
      const date = new Date(today);
      date.setDate(date.getDate() - 6);
      return date.toISOString().slice(0, 10);
    }
    if (range === 'year') {
      return `${today.getFullYear()}-01-01`;
    }
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private getEndDate(range: string): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatCurrency(value: number | string): string {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numericValue)) {
      return '0';
    }
    return numericValue.toLocaleString('fr-FR');
  }

  loadDashboardData() {
    this.beginLoading();
    // Charger les statistiques du partenaire
    this.partnerApiService
      .getPartnerStats()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (stats: any) => {
          this.metricsSignal.set({
            revenue: {
              value: this.formatCurrency(stats.revenue ?? 0),
              currency: 'XAF',
              change: stats.revenueChange || '0%',
            },
            activeTrips: {
              value: stats.activeTrips?.toString() || '0',
              routes: `${stats.totalRoutes || 0} itinéraires`,
            },
            totalPassengers: {
              value: stats.totalPassengers?.toString() || '0',
              description: "Manifestés aujourd'hui",
            },
          });
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.alertService.error('Erreur de chargement des statistiques du tableau de bord');
        },
      });

    // Charger les trajets à venir
    this.partnerApiService
      .getTodaysTrips()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (trips: any[]) => {
          this.upcomingTripsSignal.set(
            trips.map((trip) => ({
              id: trip?.bus?.registrationNumber || trip.id,
              route: `${
                trip.departureCity ||
                trip.boardingPoints?.[0]?.name ||
                trip.departurePoint?.name ||
                'N/A'
              } → ${
                trip.arrivalCity ||
                trip.deboardingPoints?.[0]?.name ||
                trip.arrivalPoint?.name ||
                'N/A'
              }`,
              date: new Date(trip.departureTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })|| trip.departure_time || 'N/A',
              time: new Date(trip.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit',  minute: '2-digit'}) || trip.departure_time || 'N/A',
              status: trip.status || 'Programmé',
            })),
          );
        },
        error: (error) => {
          console.error('Error loading trips:', error);
          this.alertService.error('Erreur de chargement des trajets à venir');
        },
      });
  }

  loadRecentActivity() {
    this.beginLoading();
    // Charger les notifications récentes comme activité
    this.partnerApiService
      .getNotifications()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe({
        next: (notifications: any[]) => {
          this.recentActivitySignal.set(
            notifications.slice(0, 4).map((notif) => ({
              icon: this.getIconForNotification(notif.type),
              colorClass: this.getColorClassForNotification(notif.type),
              title: notif.title,
              time: this.formatTime(notif.createdAt),
            })),
          );
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.alertService.error("Erreur de chargement de l'activité récente");
        },
      });
  }

  getColorClassForNotification(type: string): string {
    const classes: Record<string, string> = {
      BOOKING: 'bg-primary-container text-on-primary-container',
      PAYMENT: 'bg-warning-gold/20 text-tertiary-container',
      TICKET: 'bg-success-green/20 text-success-green',
      ALERT: 'bg-surface-container-high text-on-surface-variant',
      INFO: 'bg-surface-container-high text-on-surface-variant',
    };
    return classes[type] || 'bg-surface-container-high text-on-surface-variant';
  }

  getIconForNotification(type: string): string {
    const icons: Record<string, string> = {
      BOOKING: 'add_circle',
      PAYMENT: 'account_balance_wallet',
      TICKET: 'check_circle',
      ALERT: 'warning',
      INFO: 'info',
    };
    return icons[type] || 'info';
  }

  getTypeForNotification(type: string): 'success' | 'warning' | 'info' {
    const types: Record<string, 'success' | 'warning' | 'info'> = {
      BOOKING: 'success',
      PAYMENT: 'warning',
      TICKET: 'success',
      ALERT: 'warning',
      INFO: 'info',
    };
    return types[type] || 'info';
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'il y a quelques instants';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'il y a quelques instants';
    if (minutes < 60) return `il y a ${minutes} mins`;
    if (hours < 24) return `il y a ${hours} heures`;

    return date.toLocaleDateString('fr-FR');
  }

  goTo(url : string): void {
    this.route.navigate([url])
  }

  viewTripDetails(trip: any): void {
    console.log('Voir détails pour:', trip);
    // Logique pour afficher les détails
  }

  editTrip(trip: any): void {
    console.log('Modifier trajet:', trip);
    // Logique pour modifier le trajet
  }

  onNotificationClosed(): void {
    this.showNotificationSignal.set(false);
  }
}
