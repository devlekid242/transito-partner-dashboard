import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CurrencyPipe, DecimalPipe, CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ChartConfiguration } from "chart.js";
import { forkJoin } from 'rxjs';
import { IconComponent } from "../../shared/icon.component";
import { StatCardComponent } from "../../components/stat-card/stat-card.component";
import { ChartComponent } from "../../components/chart/chart.component";
import { DatatableComponent } from "../../components/datatable/datatable.component";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { PartnerApiService } from "../../services/partner-api.service";
import { ToastService } from "../../components/toast/toast.component";
import {
  ColumnDef,
  ActionDef,
  KpiData,
  NotificationItem,
  Trajet,
} from "../../models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    IconComponent,
    StatCardComponent,
    ChartComponent,
    DatatableComponent,
    PageHeaderComponent,
  ],
  templateUrl:'./dashboard.page.html',
})
export class DashboardPage implements OnInit {
  private api = inject(PartnerApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // State
  readonly isLoading = signal<boolean>(true);

  // KPI - peut être null
  kpiSignal = this.api.kpi;
  period = signal<"7j" | "30j" | "12m">("7j");
  openScanModal = signal(false);
  ticketCode = "";
  validating = signal(false);

  periods = [
    { key: "7j" as const, label: "7 jours" },
    { key: "30j" as const, label: "30 jours" },
    { key: "12m" as const, label: "12 mois" },
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    forkJoin({
      stats: this.api.getPartnerStats(),
      bookings: this.api.getRecentBookings(),
      notifications: this.api.getNotifications(),
      trips: this.api.getTodaysTrips(),
      revenue: this.api.loadRevenueChart(this.period()),
    }).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        console.error('Erreur de chargement du tableau de bord:', err);
        this.toast.danger('Impossible de charger toutes les données du tableau de bord.');
        this.isLoading.set(false);
      },
    });
  }

  loadRevenueData(): void {
    this.api.loadRevenueChart(this.period()).subscribe({
      error: (err) => console.error('Erreur de chargement des revenus:', err),
    });
  }

  kpiTrend = computed(() => {
    const kpi: any = this.kpiSignal();
    return {
      revenue: kpi?.revenueChange ? `${kpi.revenueChange > 0 ? '+' : ''}${kpi.revenueChange}%` : '',
      trips: kpi?.tripsChange ? `${kpi.tripsChange > 0 ? '+' : ''}${kpi.tripsChange}` : '',
      passengers: kpi?.passengersChange ? `${kpi.passengersChange > 0 ? '+' : ''}${kpi.passengersChange}%` : '',
    };
  });

  closeScanModal(): void {
    this.openScanModal.set(false);
    this.ticketCode = "";
  }

  validateTicketCode() {
    if (!this.ticketCode) return;
    this.validating.set(true);
    this.api.validateTicket(this.ticketCode).subscribe({
      next: (res) => {
        this.validating.set(false);
        this.closeScanModal();
        this.toast.success(res.message || "Billet validé avec succès !");
        this.ticketCode = "";
      },
      error: (err) => {
        this.validating.set(false);
        console.error("Erreur de validation:", err);
        this.toast.danger("Erreur lors de la validation du billet.");
      },
    });
  }

  selectPeriod(value: "7j" | "30j" | "12m"): void {
    this.period.set(value);
    this.api.loadRevenueChart(value).subscribe({
      error: (err) => console.error('Erreur de changement de période:', err),
    });
  }

  chartData = computed<ChartConfiguration["data"]>(() => {
    const d = this.api.revenueChart()
    return {
      labels: d.labels,
      datasets: [
        {
          label: "Revenus (FCFA)",
          data: d.data,
          borderColor: "#059669",
          backgroundColor: "rgba(16,185,129,0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: "#059669",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration["options"] = {
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "#f1f5f9" }, ticks: { color: "#64748b" } },
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
    },
  };

  donutData = computed<ChartConfiguration["data"]>(() => {
    const kpiData = this.kpiSignal();
    const occupationRate = kpiData?.boardingRate || 0;
    return {
      labels: ["Occupé", "Disponible"],
      datasets: [
        {
          data: [occupationRate, 100 - occupationRate],
          backgroundColor: ["#059669", "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    };
  });

  donutOptions: any = {
    cutout: "72%",
    plugins: {
      legend: { position: "bottom", labels: { color: "#475569", padding: 16 } },
    },
  };

  activity = computed(() =>
    this.api
      .notifications()
      .slice(0, 4)
      .map((n) => ({
        id: n.id,
        title: n.titre || n.title || "Notification",
        message: n.message || "",
        time: n.date
          ? new Date(n.date).toLocaleString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        icon: this.getNotificationIcon(n.type || n.category || ""),
        bg: this.getNotificationBg(n.type || n.category || ""),
      })),
  );

  getNotificationIcon(type: string): string {
    const typeMap: Record<string, string> = {
      success: "check-circle",
      SUCCESS: "check-circle",
      warning: "alert-triangle",
      WARNING: "alert-triangle",
      danger: "x-circle",
      DANGER: "x-circle",
      error: "x-circle",
      ERROR: "x-circle",
    };
    return typeMap[type] || "info";
  }

  getNotificationBg(type: string): string {
    const typeMap: Record<string, string> = {
      success: "bg-brand-50 text-brand-600",
      SUCCESS: "bg-brand-50 text-brand-600",
      warning: "bg-amber-50 text-amber-600",
      WARNING: "bg-amber-50 text-amber-600",
      danger: "bg-red-50 text-red-600",
      DANGER: "bg-red-50 text-red-600",
      error: "bg-red-50 text-red-600",
      ERROR: "bg-red-50 text-red-600",
    };
    return typeMap[type] || "bg-primary-50 text-primary-600";
  }

  recentReservations = computed(() => this.api.reservations().slice(0, 10));

  upcoming = computed(() =>
    this.api
      .trajets()
      .filter(
        (t) =>
          t.status === "planifie" ||
          t.status === "en_cours" ||
          t.statut === "planifie" ||
          t.statut === "en_cours" ||
          t.status === "active" ||
          t.statut === "actif",
      )
      .slice(0, 4),
  );

  resCols: ColumnDef[] = [
    { key: "reference", label: "Référence", sortable: true },
    { key: "passager", label: "Passager", sortable: true },
    { key: "trajet", label: "Trajet", sortable: true },
    { key: "date", label: "Date", type: "date", sortable: true },
    { key: "montant", label: "Montant", type: "currency", sortable: true },
    { key: "statut", label: "Statut", type: "status", sortable: true },
  ];

  resActions: ActionDef[] = [
    {
      label: "Reçu",
      icon: "download",
      class: "ghost",
      action: (r) => this.downloadReservationReceipt(r),
    },
  ];

  downloadReservationReceipt(reservation: any): void {
    this.api.getReservationReceipt(reservation.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `recu-${reservation.reference || reservation.id}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur de téléchargement du reçu:', err);
        this.toast.danger('Impossible de télécharger le reçu.');
      },
    });
  }

  String(value: any): string {
    return value !== null && value !== undefined ? String(value) : "";
  }

  goToAddTrip(): void {
    this.router.navigate(['/ajout-trajet']);
  }
}
