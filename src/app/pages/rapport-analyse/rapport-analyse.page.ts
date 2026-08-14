import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { IconComponent } from '../../shared/icon.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ChartComponent } from '../../components/chart/chart.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { DatatableComponent } from '../../components/datatable/datatable.component';
import { ToastService } from '../../components/toast/toast.component';
import { PartnerApiService } from '../../services/partner-api.service';

@Component({
  selector: 'app-rapport-analyse',
  standalone: true,
  imports: [FormsModule, IconComponent, StatCardComponent, ChartComponent, PageHeaderComponent, DatatableComponent],
  template: `
    <div class="space-y-6">
      <app-page-header title="Rapports & Analyses" subtitle="Analysez les performances de votre activité" icon="bar-chart">
        <div class="flex flex-wrap gap-2">
          <select class="input !w-auto cursor-pointer" [ngModel]="periode()" name="periode" (ngModelChange)="periode.set($event); loadData()">
            @for (option of dateRangeOptions(); track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
          <select class="input !w-auto cursor-pointer" [ngModel]="categorie()" name="categorie" (ngModelChange)="categorie.set($event)">
            @for (option of categoryOptions(); track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>
      </app-page-header>
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span class="ml-3">Chargement des rapports...</span>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <app-stat-card label="Revenus totaux" [value]="totalRevenue()" icon="banknote" iconBg="bg-brand-50 text-brand-600" [trend]="revenueTrend()" [trendUp]="true" />
          <app-stat-card label="Taux de remplissage" [value]="fillRate()" icon="trending-up" iconBg="bg-primary-50 text-primary-600" [trend]="fillRateTrend()" [trendUp]="true" />
          <app-stat-card label="Trajets effectués" [value]="totalTrips()" icon="route" iconBg="bg-amber-50 text-amber-600" [trend]="tripsTrend()" [trendUp]="true" />
          <app-stat-card label="Annulations" [value]="cancellationRate()" icon="x-circle" iconBg="bg-red-50 text-red-600" [trend]="cancellationTrend()" [trendUp]="false" />
        </div>
        @if (balance()) {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <app-stat-card label="Chiffre d'affaires" [value]="formatCurrency(balance()?.totalRevenue ?? balance()?.revenue ?? 0)" icon="banknote" iconBg="bg-brand-50 text-brand-600" />
            <app-stat-card label="Retraits" [value]="formatCurrency(balance()?.totalWithdrawals ?? balance()?.withdrawals ?? 0)" icon="arrow-up-right" iconBg="bg-amber-50 text-amber-600" />
            <app-stat-card label="Solde disponible" [value]="formatCurrency(balance()?.soldeDisponible ?? balance()?.availableBalance ?? 0)" icon="wallet" iconBg="bg-primary-50 text-primary-600" />
          </div>
        }
        @if (statusSummary().length) {
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Réservations par statut</h3>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              @for (item of statusSummary(); track item.label) {
                <div class="rounded-xl border border-ink-100 p-4"><p class="text-xs uppercase tracking-wide text-ink-400">{{ item.label }}</p><p class="mt-1 text-xl font-bold text-ink-900">{{ item.value }}</p></div>
              }
            </div>
          </div>
        }
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Revenus par trajet</h3>
            <p class="text-sm text-ink-500">Top destinations</p>
            <div class="mt-4 h-64"><app-chart type="bar" [data]="barData()" [options]="barOptions" /></div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Évolution mensuelle</h3>
            <p class="text-sm text-ink-500">Revenus vs réservations</p>
            <div class="mt-4 h-64"><app-chart type="line" [data]="lineData()" [options]="lineOptions" /></div>
          </div>
        </div>
        <div class="flex flex-wrap justify-end gap-3">
          <button type="button" class="btn btn-secondary" (click)="loadSavedReports()" [disabled]="isLoadingReports()">
            <app-icon name="refresh-cw" [size]="16" /> Actualiser les rapports
          </button>
          <button type="button" class="btn btn-secondary" (click)="exportCurrentReport()" [disabled]="isExporting()">
            <app-icon name="download" [size]="16" /> Exporter l'analyse
          </button>
        </div>
        @if (recentTransactions().length) {
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Transactions récentes</h3>
            <div class="mt-4"><app-datatable [columns]="transactionCols" [data]="recentTransactions()" [exportable]="true" /></div>
          </div>
        }
        @if (withdrawals().length) {
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Demandes de retrait</h3>
            <div class="mt-4"><app-datatable [columns]="withdrawalCols" [data]="withdrawals()" [exportable]="true" /></div>
          </div>
        }
        <div class="card p-5">
          <h3 class="font-bold text-ink-900">Rapports enregistrés</h3>
          <div class="mt-4">
            <app-datatable [columns]="reportCols" [data]="savedReports()" [exportable]="true" [rowActions]="reportActions" />
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-ink-900">Performance par bus</h3>
          <div class="mt-4 space-y-4">
            @for (b of busPerf(); track b.id) {
              <div>
                <div class="flex justify-between text-sm"><span class="font-medium text-ink-700">{{ b.modele }} — {{ b.immat }}</span><span class="font-bold text-ink-900">{{ b.taux }}%</span></div>
                <div class="mt-2 h-2.5 rounded-full bg-ink-100"><div class="h-2.5 rounded-full" [class]="b.taux > 75 ? 'bg-brand-500' : b.taux > 50 ? 'bg-primary-500' : 'bg-amber-500'" [style.width.%]="b.taux"></div></div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class RapportAnalysePage implements OnInit {
  api = inject(PartnerApiService);
  private toast = inject(ToastService);
  
  readonly isLoading = signal<boolean>(true);
  periode = signal('30j');
  categorie = signal('all');
  readonly dateRangeOptions = signal<any[]>([
    { value: '7j', label: '7 derniers jours' },
    { value: '30j', label: '30 derniers jours' },
    { value: '12m', label: '12 derniers mois' },
  ]);
  readonly categoryOptions = signal<any[]>([
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'performance', label: 'Performance' },
    { value: 'finance', label: 'Finance' },
    { value: 'trips', label: 'Trajets' },
  ]);
  
  // Report data
  readonly reportData = signal<any>(null);
  readonly reportStats = signal<any>(null);
  readonly balance = signal<any>(null);
  readonly statusSummary = signal<any[]>([]);
  readonly recentTransactions = signal<any[]>([]);
  readonly withdrawals = signal<any[]>([]);
  readonly isExporting = signal<boolean>(false);
  readonly isLoadingReports = signal<boolean>(false);
  readonly savedReports = signal<any[]>([]);

  reportCols = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'title', label: 'Titre', sortable: true },
    { key: 'type', label: 'Catégorie', sortable: true },
    { key: 'date', label: 'Date', type: 'date' as const, sortable: true },
    { key: 'status', label: 'Statut', type: 'status' as const, sortable: true },
  ];

  reportActions = [
    { label: 'Télécharger', icon: 'download', class: 'ghost' as const, action: (report: any) => this.downloadReport(report) },
  ];
  transactionCols = [
    { key: 'description', label: 'Description', sortable: true },
    { key: 'amount', label: 'Montant', type: 'currency' as const, sortable: true },
    { key: 'status', label: 'Statut', type: 'status' as const, sortable: true },
    { key: 'createdAt', label: 'Date', type: 'date' as const, sortable: true },
  ];
  withdrawalCols = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'montant', label: 'Montant', type: 'currency' as const, sortable: true },
    { key: 'statut', label: 'Statut', type: 'status' as const, sortable: true },
    { key: 'dateDemande', label: 'Date', type: 'date' as const, sortable: true },
  ];

  barOptions: ChartConfiguration['options'] = { plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } };
  lineOptions: ChartConfiguration['options'] = { plugins: { legend: { position: 'bottom' } }, scales: { y: { grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } };

  ngOnInit(): void {
    this.api.getDateRangeOptions().subscribe({
      next: (options) => { if (options?.length) this.dateRangeOptions.set(options); },
      error: () => {},
    });
    this.api.getReportCategoryOptions().subscribe({
      next: (options) => { if (options?.length) this.categoryOptions.set([{ value: 'all', label: 'Toutes les catégories' }, ...options]); },
      error: () => {},
    });
    this.loadData();
    this.loadSavedReports();
  }

  loadData(): void {
    this.isLoading.set(true);
    const period = this.periode();
    
    // Load analytics report
    this.api.getAnalyticsReport(period).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.api.getPartnerStats().subscribe({
          next: (stats) => {
            this.reportStats.set(stats);
            this.balance.set(stats?.balance || null);
            this.statusSummary.set(
              Object.entries(stats?.reservationsByStatus || {}).map(([label, value]) => ({ label, value })),
            );
            this.recentTransactions.set(Array.isArray(stats?.recentTransactions) ? stats.recentTransactions : []);
            this.withdrawals.set(Array.isArray(stats?.withdrawals) ? stats.withdrawals : []);
          },
          error: (err) => console.error('Error loading report summary:', err),
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading analytics report:', err);
        this.toast.danger('Impossible de charger les rapports d\'analyse');
        this.isLoading.set(false);
      },
    });
  }

  loadSavedReports(): void {
    this.isLoadingReports.set(true);
    this.api.getReports().subscribe({
      next: (reports) => {
        this.savedReports.set(reports || []);
        this.isLoadingReports.set(false);
      },
      error: (err) => {
        console.error('Error loading saved reports:', err);
        this.toast.danger('Impossible de charger les rapports enregistrés.');
        this.isLoadingReports.set(false);
      },
    });
  }

  downloadReport(report: any): void {
    if (!report?.id) return;
    this.api.downloadReport(report.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = report.fileName || `rapport-${report.id}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading report:', err);
        this.toast.danger('Impossible de télécharger le rapport.');
      },
    });
  }

  formatCurrency(value: unknown): string {
    const amount = Number(value ?? 0);
    return `${Number.isFinite(amount) ? amount.toLocaleString('fr-FR') : '0'} FCFA`;
  }

  totalRevenue = computed(() => {
    const data = this.reportData();
    if (!data?.totalRevenue) return '0 FCFA';
    return `${Number(data.totalRevenue).toLocaleString('fr-FR')} FCFA`;
  });

  fillRate = computed(() => {
    const data = this.reportData();
    if (!data?.fillRate) return '0%';
    return `${Number(data.fillRate).toFixed(1)}%`;
  });

  totalTrips = computed(() => {
    const data = this.reportData();
    if (!data?.totalTrips) return '0';
    return String(data.totalTrips);
  });

  cancellationRate = computed(() => {
    const data = this.reportData();
    if (!data?.cancellationRate) return '0%';
    return `${Number(data.cancellationRate).toFixed(1)}%`;
  });

  revenueTrend = computed(() => {
    const data = this.reportData();
    return data?.revenueTrend ? `${data.revenueTrend > 0 ? '+' : ''}${data.revenueTrend}%` : '+0%';
  });

  fillRateTrend = computed(() => {
    const data = this.reportData();
    return data?.fillRateTrend ? `${data.fillRateTrend > 0 ? '+' : ''}${data.fillRateTrend}%` : '+0%';
  });

  tripsTrend = computed(() => {
    const data = this.reportData();
    return data?.tripsTrend ? `${data.tripsTrend > 0 ? '+' : ''}${data.tripsTrend}` : '+0';
  });

  cancellationTrend = computed(() => {
    const data = this.reportData();
    return data?.cancellationTrend ? `${data.cancellationTrend > 0 ? '+' : ''}${data.cancellationTrend}%` : '-0%';
  });

  barData = computed<ChartConfiguration['data']>(() => {
    const data = this.reportData();
    if (!data?.revenueByRoute) {
      return {
        labels: [],
        datasets: [{ label: 'Revenus (FCFA)', data: [], backgroundColor: [], borderRadius: 6 }],
      };
    }
    
    const routes = data.revenueByRoute || [];
    const backgroundColors = ['#059669', '#10b981', '#3880ff', '#60a5fa', '#f59e0b', '#fb923c'];
    
    return {
      labels: routes.map((r: any) => r.route || r.destination || 'Inconnu'),
      datasets: [{
        label: 'Revenus (FCFA)',
        data: routes.map((r: any) => Number(r.revenue || r.total || 0) / 1000),
        backgroundColor: backgroundColors,
        borderRadius: 6,
      }],
    };
  });

  lineData = computed<ChartConfiguration['data']>(() => {
    const data = this.reportData();
    if (!data?.monthlyData) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    const monthly = data.monthlyData || [];
    
    return {
      labels: monthly.map((m: any) => m.month || m.label || ''),
      datasets: [
        {
          label: 'Revenus',
          data: monthly.map((m: any) => Number(m.revenue || 0)),
          borderColor: '#059669',
          backgroundColor: 'rgba(16,185,129,0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
        {
          label: 'Réservations',
          data: monthly.map((m: any) => Number(m.reservations || m.bookings || 0)),
          borderColor: '#3880ff',
          backgroundColor: 'rgba(56,128,255,0.05)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
        },
      ],
    };
  });

  exportCurrentReport(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.api.generateReport({ category: this.categorie(), dateRange: this.periode() }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `rapport-${this.periode()}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.toast.success('Rapport exporté avec succès.');
        this.isExporting.set(false);
      },
      error: (err) => {
        console.error('Error exporting report:', err);
        this.toast.danger('Impossible d’exporter le rapport.');
        this.isExporting.set(false);
      },
    });
  }

  busPerf = computed(() => {
    const buses = this.api.bus();
    const report = this.reportData();
    
    return buses
      .filter((b) => b.statut === 'actif' || b.status === 'active')
      .slice(0, 5)
      .map((b) => {
        // Find bus performance from report
        const perf = (report?.busPerformance || []).find((p: any) => p.busId === b.id);
        return {
          id: b.id,
          modele: b.modele || b.model || '—',
          immat: b.immatriculation || b.registrationNumber || '—',
          taux: perf?.occupancyRate ?? perf?.fillRate ?? 0,
        };
      });
  });
}
