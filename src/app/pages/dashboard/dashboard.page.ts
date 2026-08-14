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
  template: `
    <div class="space-y-6">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <app-page-header
          title="Tableau de bord"
          subtitle="Vue d'ensemble de votre activité"
          icon="dashboard"
        />
        <button
          (click)="openScanModal.set(true)"
          class="btn btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <app-icon name="ticket" [size]="18" />
          <span>Valider un Billet</span>
        </button>
      </div>

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"
          ></div>
          <span class="ml-3">Chargement du tableau de bord...</span>
        </div>
      } @else {
        <!-- KPI cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <app-stat-card
            label="Revenus Aujourd'hui"
            [value]="
              kpiSignal()?.revenusAujourdhui
                | currency: 'XOF' : 'symbol' : '1.0-0'
            "
            icon="banknote"
            iconBg="bg-brand-50 text-brand-600"
            [trend]="kpiTrend().revenue"
            [trendUp]="true"
          />
          <app-stat-card
            label="Trajets Actifs"
            [value]="String(kpiSignal()?.trajetsActifs)"
            icon="route"
            iconBg="bg-primary-50 text-primary-600"
            [trend]="kpiTrend().trips"
            [trendUp]="true"
          />
          <app-stat-card
            label="Passagers Totaux"
            [value]="kpiSignal()?.passagersTotaux | number"
            icon="users"
            iconBg="bg-amber-50 text-amber-600"
            [trend]="kpiTrend().passengers"
            [trendUp]="true"
          />
        </div>

        <!-- Charts row -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- Revenue chart -->
          <div class="card p-5 lg:col-span-2">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-ink-900">Tendance des Revenus</h3>
                <p class="text-sm text-ink-500">Évolution des revenus</p>
              </div>
              <div class="flex rounded-lg bg-ink-100 p-0.5">
                @for (p of periods; track p.key) {
                  <button
                    class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                    [class]="
                      period() === p.key
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-ink-500'
                    "
                    (click)="period.set(p.key)"
                  >
                    {{ p.label }}
                  </button>
                }
              </div>
            </div>
            <div class="mt-4 h-72">
              <app-chart
                type="line"
                [data]="chartData()"
                [options]="chartOptions"
              />
            </div>
          </div>

          <!-- Occupation donut -->
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Taux d'Occupation</h3>
            <p class="text-sm text-ink-500">Moyenne des bus</p>
            <div class="mt-4 flex h-72 items-center justify-center">
              <app-chart
                type="doughnut"
                [data]="donutData()"
                [options]="donutOptions"
              />
            </div>
          </div>
        </div>

        <!-- Activity + Upcoming -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div class="card p-5">
            <h3 class="font-bold text-ink-900">Activité Récente</h3>
            <div class="mt-4 space-y-4">
              @for (a of activity(); track a.id) {
                <div class="flex gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    [class]="a.bg"
                  >
                    <app-icon [name]="a.icon" [size]="16" />
                  </div>
                  <div class="flex-1 border-b border-ink-100 pb-4">
                    <p class="text-sm font-semibold text-ink-800">
                      {{ a.title }}
                    </p>
                    <p class="text-sm text-ink-500">{{ a.message }}</p>
                    <p class="mt-1 text-xs text-ink-400">{{ a.time }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-ink-900">Départs à Venir</h3>
              <a
                routerLink="/trip-schedule"
                class="text-sm font-semibold text-primary-600 hover:text-primary-700"
                >Voir tout</a
              >
            </div>
            <div class="mt-4 space-y-2">
              @for (t of upcoming(); track t.id) {
                <div
                  class="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
                    >
                      <app-icon name="bus" [size]="18" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-ink-800">
                        {{
                          t.departureCity || t.origine || t.departure || "—"
                        }}
                        →
                        {{ t.arrivalCity || t.destination || t.arrival || "—" }}
                      </p>
                      <p class="text-xs text-ink-500">
                        {{
                          t.departureTime ||
                            t.heureDepart ||
                            t.departureTimeOfDay ||
                            "—"
                        }}
                        ·
                        {{
                          t.tripDate ||
                            t.dateDepart ||
                            t.departureDate ||
                            "Aujourd'hui"
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-ink-900">
                      {{ t.availableSeats || t.placesDisponibles || 0 }}
                    </p>
                    <p class="text-xs text-ink-500">places</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Reservations datatable -->
        <div>
          <h3 class="mb-3 text-lg font-bold text-ink-900">
            Réservations récentes
          </h3>
          <app-datatable
            [columns]="resCols"
            [data]="recentReservations()"
            [exportable]="true"
            [selectable]="true"
            [rowActions]="resActions"
          />
        </div>

        <!-- Ticket validation modal -->
        @if (openScanModal()) {
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div class="w-full max-w-md card p-6 bg-white rounded-xl shadow-xl">
              <div
                class="flex items-center justify-between border-b border-ink-100 pb-3"
              >
                <h3
                  class="font-bold text-lg text-ink-900 flex items-center gap-2"
                >
                  <app-icon name="ticket" [size]="20" /> Validation de Billet
                </h3>
                <button
                  (click)="closeScanModal()"
                  class="text-ink-400 hover:text-ink-600"
                >
                  <app-icon name="x" [size]="20" />
                </button>
              </div>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="label">Code du Billet ou QR Code</label>
                  <input
                    type="text"
                    class="input"
                    placeholder="Ex: TKT-8841"
                    [(ngModel)]="ticketCode"
                  />
                </div>
                <button
                  (click)="validateTicketCode()"
                  [disabled]="validating()"
                  class="btn btn-primary w-full"
                >
                  @if (validating()) {
                    Validation en cours...
                  } @else {
                    Valider le Billet
                  }
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
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
    const d = this.api.revenusChart(this.period());
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
    const occupationRate = kpiData?.tauxOccupation || 0;
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
}
