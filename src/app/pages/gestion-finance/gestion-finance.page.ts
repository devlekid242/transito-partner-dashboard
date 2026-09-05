import { Component, inject, computed, signal, OnInit } from "@angular/core";
import { ChartConfiguration } from "chart.js";
import { IconComponent } from "../../shared/icon.component";
import { StatCardComponent } from "../../components/stat-card/stat-card.component";
import { ChartComponent } from "../../components/chart/chart.component";
import { DatatableComponent } from "../../components/datatable/datatable.component";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { RouterLink } from "@angular/router";
import { ToastService } from "../../components/toast/toast.component";
import { PartnerApiService } from "../../services/partner-api.service";
import { ColumnDef, ActionDef, Transaction } from "../../models";

@Component({
  selector: "app-gestion-finance",
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatCardComponent,
    ChartComponent,
    DatatableComponent,
    PageHeaderComponent,
  ],
  templateUrl:'./gestion-finance.page.html',
})
export class GestionFinancePage implements OnInit {
  private api = inject(PartnerApiService);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);
  readonly partnerStats = signal<any>(null);
  readonly revenueData = signal<any>(null);

  // Computed
  availableBalance = computed(() => {
    const stats = this.partnerStats();
    if (!stats?.balance) return '0 FCFA';
    const balance = Number(stats.balance?.available ?? 0);
    return `${balance.toLocaleString('fr-FR')} FCFA`;
  });

  grossRevenue = computed(() => {
    const stats = this.partnerStats();
    const revenue = Number(stats?.revenue ?? 0);
    return `${revenue.toLocaleString('fr-FR')} FCFA`;
  });

  netRevenue = computed(() => {
    const stats = this.partnerStats();
    const revenue = Number(stats?.netRevenue ?? 0);
    return `${revenue.toLocaleString('fr-FR')} FCFA`;
  });

  totalWithdrawn = computed(() => {
    const stats = this.partnerStats();
    return `${Number(stats?.balance?.totalWithdrawn ?? 0).toLocaleString('fr-FR')} FCFA`;
  });

  reservationStatuses = computed(() => {
    const statuses = this.partnerStats()?.reservationsByStatus ?? {};
    return [
      { label: 'En attente de paiement', value: statuses.enAttentePaiement ?? 0 },
      { label: 'Confirmées', value: statuses.confirmees ?? 0 },
      { label: 'Échouées', value: statuses.echouees ?? 0 },
      { label: 'Annulées / remboursement en attente', value: statuses.annuleesRemboursementEnAttente ?? 0 },
      { label: 'Annulées / remboursées', value: statuses.annuleesRembourseesConfirmees ?? 0 },
      { label: 'Annulées sans paiement', value: statuses.annuleesSansPaiementPrealable ?? 0 },
    ];
  });

  withdrawals = computed(() => this.partnerStats()?.withdrawals ?? []);

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

    const labels = data.labels || [];
    const values = (data.data || []).map((value: string | number) => Number(value));

    return {
      labels: labels,
      datasets: [
        {
          label: "Revenus",
          data: values,
          backgroundColor: "#10b981",
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

  recentTransactions = computed(() => this.partnerStats()?.recentTransactions ?? []);

  filteredTransactions = computed(() => this.recentTransactions());

  cols: ColumnDef[] = [
    { key: "description", label: "Description", sortable: true },
    { key: "amount", label: "Montant", type: "currency", signed: true, sortable: true },
    { key: "status", label: "Statut", type: "status", sortable: true },
    { key: "createdAt", label: "Date", type: "date", sortable: true },
  ];

  withdrawalCols: ColumnDef[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'amount', label: 'Montant', type: 'currency', sortable: true },
    { key: 'status', label: 'Statut', type: 'status', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'createdAt', label: 'Date', type: 'date', sortable: true },
  ];

  actions: ActionDef[] = [
    { label: "Voir", icon: "eye", action: (t: Transaction) => this.viewTransaction(t) },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadData();
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
        this.toast.danger(err, 'Impossible de charger les statistiques financières');
        this.isLoading.set(false);
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
        this.toast.danger(err, 'Impossible de charger les données du graphique');
      },
    });
  }

  viewTransaction(transaction: Transaction): void {
    const details = [
      `Transaction: ${transaction.id || 'N/A'}`,
      `Montant: ${(transaction.montant || transaction.amount || 0).toLocaleString('fr-FR')} FCFA`,
      `Description: ${transaction.description || 'Aucune'}`,
      `Date: ${transaction.date || transaction.createdAt || 'N/A'}`,
      `Statut: ${transaction.statut || transaction.status || 'N/A'}`,
      `Type: ${transaction.type || 'N/A'}`,
    ].join('\n');
    
    this.toast.info(details);
  }
}
