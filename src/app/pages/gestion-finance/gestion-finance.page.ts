import { Component, inject, computed, signal, OnInit } from "@angular/core";
import { ChartConfiguration } from "chart.js";
import { IconComponent } from "../../shared/icon.component";
import { StatCardComponent } from "../../components/stat-card/stat-card.component";
import { ChartComponent } from "../../components/chart/chart.component";
import { DatatableComponent } from "../../components/datatable/datatable.component";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ToastService } from "../../components/toast/toast.component";
import { PartnerApiService } from "../../services/partner-api.service";
import { SelectOption, ColumnDef, ActionDef, Transaction } from "../../models";

@Component({
  selector: "app-gestion-finance",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    IconComponent,
    StatCardComponent,
    ChartComponent,
    DatatableComponent,
    PageHeaderComponent,
  ],
  template: ` <div class="space-y-6">
    <app-page-header
      title="Gestion financière"
      subtitle="Suivez vos revenus et transactions"
      icon="wallet"
      ><a routerLink="/demande-de-retrait" class="btn btn-primary"
        ><app-icon name="banknote" [size]="16" /> Demander un retrait</a
      ></app-page-header
    >
    @if (isLoading()) {
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <span class="ml-3">Chargement des données financières...</span>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <app-stat-card
          label="Solde disponible"
          [value]="availableBalance()"
          icon="banknote"
          iconBg="bg-brand-50 text-brand-600"
        /><app-stat-card
          label="Revenus du mois"
          [value]="monthlyRevenue()"
          icon="trending-up"
          iconBg="bg-primary-50 text-primary-600"
        /><app-stat-card
          label="Commissions"
          [value]="commissions()"
          icon="wallet"
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>
      
      <div class="card p-4">
        <div class="flex flex-wrap items-center gap-4">
          <label class="text-sm font-medium text-ink-600">Filtrer par type:</label>
          <select
            class="input input-sm cursor-pointer w-48"
            [ngModel]="selectedTransactionType()"
            (ngModelChange)="setTransactionType($event)"
          >
            @for (type of transactionTypes(); track type.value) {
              <option [value]="type.value">{{ type.label }}</option>
            }
          </select>
        </div>
      </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div class="card p-5 lg:col-span-3">
        <h3 class="font-bold text-ink-900">Flux financiers</h3>
        <p class="text-sm text-ink-500">
          Crédits et débits des 30 derniers jours
        </p>
        <div class="mt-4 h-64">
          <app-chart type="bar" [data]="chartData()" [options]="chartOptions" />
        </div>
      </div>
      <div class="card p-5 lg:col-span-2">
        <h3 class="font-bold text-ink-900">Répartition</h3>
        <div class="mt-4 space-y-4">
          @for (item of financeBreakdown(); track item.label) {
          <div>
            <div class="flex justify-between text-sm">
              <span class="text-ink-600">{{ item.label }}</span>
              <b class="text-ink-900">{{ item.percentage }}%</b>
            </div>
            <div class="mt-2 h-2 rounded-full bg-ink-100">
              <div class="h-2 rounded-full" [style.width.%]="item.percentage" [style.background-color]="item.color"></div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>

    <app-datatable
      [columns]="cols"
      [data]="filteredTransactions()"
      [exportable]="true"
      [selectable]="true"
      [rowActions]="actions"
    />
    }
  </div>`,
})
export class GestionFinancePage implements OnInit {
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly partnerStats = signal<any>(null);
  readonly transactionTypes = signal<SelectOption[]>([]);
  readonly selectedTransactionType = signal<string>('all');
  readonly revenueData = signal<any>(null);

  // Computed
  availableBalance = computed(() => {
    const stats = this.partnerStats();
    if (!stats?.balance) return '0 FCFA';
    const balance = Number(stats.balance?.available ?? 0);
    return `${balance.toLocaleString('fr-FR')} FCFA`;
  });

  monthlyRevenue = computed(() => {
    const stats = this.partnerStats();
    const revenue = Number(stats?.netRevenue ?? stats?.revenue ?? 0);
    return `${revenue.toLocaleString('fr-FR')} FCFA`;
  });

  commissions = computed(() => {
    const stats = this.partnerStats();
    const commissions = Number(stats?.platformFees ?? stats?.commissions ?? 0);
    return `${commissions.toLocaleString('fr-FR')} FCFA`;
  });

  financeBreakdown = computed(() => {
    const stats = this.partnerStats();
    if (!stats?.balance) {
      return [
        { label: 'Réservations', percentage: 0, color: '#10b981' },
        { label: 'Retraits', percentage: 0, color: '#3880ff' },
        { label: 'Commissions', percentage: 0, color: '#f59e0b' },
      ];
    }

    const available = Number(stats.balance?.available ?? 0);
    const pending = Number(stats.balance?.pending ?? 0);
    const fees = Number(stats.platformFees ?? 0);
    const total = available + pending + fees;

    if (total === 0) {
      return [
        { label: 'Réservations', percentage: 0, color: '#10b981' },
        { label: 'Retraits', percentage: 0, color: '#3880ff' },
        { label: 'Commissions', percentage: 0, color: '#f59e0b' },
      ];
    }

    return [
      { label: 'Réservations', percentage: Math.round((available / total) * 100), color: '#10b981' },
      { label: 'Retraits', percentage: Math.round((pending / total) * 100), color: '#3880ff' },
      { label: 'Commissions', percentage: Math.round((fees / total) * 100), color: '#f59e0b' },
    ];
  });

  chartData = computed(() => {
    const data = this.revenueData();
    if (!data?.labels || !data?.data) {
      return {
        labels: [],
        datasets: [
          { label: "Crédits", data: [], backgroundColor: "#10b981", borderRadius: 5 },
          { label: "Débits", data: [], backgroundColor: "#3880ff", borderRadius: 5 },
        ],
      };
    }

    const creditsData = data.credits || data.data?.[0]?.data || [];
    const debitsData = data.debits || data.data?.[1]?.data || [];
    const labels = data.labels || [];

    return {
      labels: labels,
      datasets: [
        {
          label: "Crédits",
          data: creditsData,
          backgroundColor: "#10b981",
          borderRadius: 5,
        },
        {
          label: "Débits",
          data: debitsData,
          backgroundColor: "#3880ff",
          borderRadius: 5,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration["options"] = {
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: { grid: { color: "#f1f5f9" } },
      x: { grid: { display: false } },
    },
  };

  filteredTransactions = computed(() => {
    const type = this.selectedTransactionType();
    const allTransactions = this.api.transactions();

    if (type === 'all') {
      return allTransactions;
    }

    return allTransactions.filter((t: any) => {
      const transactionType = String(t.type || t.description || '').toLowerCase();
      return transactionType.includes(type.toLowerCase());
    });
  });

  cols: ColumnDef[] = [
    { key: "reference", label: "Référence", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "montant", label: "Montant", type: "currency", sortable: true },
    { key: "description", label: "Description", sortable: true },
    { key: "date", label: "Date", type: "date", sortable: true },
  ];

  actions: ActionDef[] = [
    { label: "Voir", icon: "eye", action: (t: Transaction) => this.viewTransaction(t) },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadData();
  }

  setTransactionType(type: string): void {
    this.selectedTransactionType.set(type);
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load partner stats (balance, recent transactions)
    this.api.getPartnerStats().subscribe({
      next: (stats) => {
        this.partnerStats.set(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading partner stats:', err);
        this.toast.danger('Impossible de charger les statistiques financières');
        this.isLoading.set(false);
      },
    });

    // Load transaction types
    this.api.getTransactionTypeOptions().subscribe({
      next: (types) => {
        this.transactionTypes.set([
          { value: 'all', label: 'Tous les types' },
          ...types,
        ]);
      },
      error: (err) => {
        console.error('Error loading transaction types:', err);
        this.toast.danger('Impossible de charger les types de transactions');
      },
    });

    // Load revenue data for chart (last 30 days)
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = today.toISOString().slice(0, 10);

    this.api.getRevenue(startStr, endStr).subscribe({
      next: (data) => {
        this.revenueData.set(data);
      },
      error: (err) => {
        console.error('Error loading revenue data:', err);
        this.toast.danger('Impossible de charger les données du graphique');
      },
    });
  }

  viewTransaction(transaction: Transaction): void {
    const details = [
      `Référence: ${transaction.reference || 'N/A'}`,
      `Type: ${transaction.type || 'N/A'}`,
      `Montant: ${(transaction.montant || transaction.amount || 0).toLocaleString('fr-FR')} FCFA`,
      `Description: ${transaction.description || 'Aucune'}`,
      `Date: ${transaction.date || transaction.createdAt || 'N/A'}`,
      `Statut: ${transaction.statut || transaction.status || 'N/A'}`,
    ].join('\n');
    
    this.toast.info(details);
  }
}
