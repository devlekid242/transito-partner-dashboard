import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TableComponent, TableColumn, TableAction } from '../../components/table/table.component';
import { PartnerApiService } from '../../services/partner-api.service';
import { Trip } from '../../models/partner.model';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-trip-schedule',
  templateUrl: './trip-schedule.page.html',
  styleUrls: ['./trip-schedule.page.css'],
  imports: [TableComponent, CommonModule],
})
export class TripSchedulePage implements OnInit {
  todayDepartures = signal<any[]>([]);
  upcomingTrips = signal<any[]>([]);
  nextDeparture = signal<any | null>(null);
  isLoading = signal<boolean>(false);
  private pendingLoadingRequests = 0;

  departureColumns = signal<TableColumn[]>([
    { key: 'departureTime', title: 'Time & Date', sortable: true },
    { key: 'route', title: 'Route', sortable: true },
    { key: 'bus', title: 'Assigned Bus', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ]);

  upcomingColumns = signal<TableColumn[]>([
    { key: 'id', title: 'ID' },
    { key: 'departureTime', title: 'Time' },
    { key: 'route', title: 'Route' },
    { key: 'bus', title: 'Bus' },
    { key: 'status', title: 'Status' },
  ]);

  departureActions = signal<TableAction[]>([
    {
      icon: 'visibility',
      label: 'View Details',
      action: (item) => this.viewTripDetails(item),
    },
    {
      icon: 'edit',
      label: 'Manage',
      action: (item) => this.manageTrip(item),
    },
  ]);

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
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

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.beginLoading();
    this.partnerApiService.getTodaysTrips().pipe(
      finalize(() => this.finishLoading())
    ).subscribe({
      next: (trips: Trip[]) => {
        this.todayDepartures.set(trips.map((trip) => {
            const anyTrip = trip as any;
            return {
              ...trip,
              departureTime:
                anyTrip.tripDate && anyTrip.departureTimeOfDay
                  ? `${anyTrip.tripDate} ${anyTrip.departureTimeOfDay}`
                  : trip.departureTime,
              date: anyTrip.tripDate ?? trip.departureTime?.split('T')[0] ?? '',
              route:
                trip.departureCity || trip.boardingPoints?.[0]?.name || trip.departurePoint?.name
                  ? `${trip.departureCity || trip.boardingPoints?.[0]?.name || trip.departurePoint?.name} → ${
                      trip.arrivalCity ||
                      trip.deboardingPoints?.[0]?.name ||
                      trip.arrivalPoint?.name ||
                      'Route'
                    }`
                  : 'Route',
              bus: trip.bus?.registrationNumber || 'N/A',
              status: trip.status,
              driverName: trip.driverName || 'Non précisé',
            };
        }));
        this.nextDeparture.set(this.todayDepartures().length ? this.todayDepartures()[0] : null);
        },
      error: (error) => {
          console.error('Error loading today trips:', error);
          this.alertService.error('Erreur de chargement des départs du jour');
        },
    });
    this.beginLoading();
    this.partnerApiService.getTrips().pipe(
      finalize(() => this.finishLoading())
    ).subscribe({
      next: (trips: Trip[]) => {
        this.upcomingTrips.set(trips.slice(0, 5).map((trip) => {
            const anyTrip = trip as any;
            return {
              id: trip.id?.toString() ?? '',
              departureTime:
                anyTrip.tripDate && anyTrip.departureTimeOfDay
                  ? `${anyTrip.tripDate} ${anyTrip.departureTimeOfDay}`
                  : trip.departureTime,
              route:
                trip.departureCity || trip.boardingPoints?.[0]?.name || trip.departurePoint?.name
                  ? `${trip.departureCity || trip.boardingPoints?.[0]?.name || trip.departurePoint?.name} → ${
                      trip.arrivalCity ||
                      trip.deboardingPoints?.[0]?.name ||
                      trip.arrivalPoint?.name ||
                      'Route'
                    }`
                  : 'Route',
              bus: trip.bus?.registrationNumber || 'N/A',
              status: this.getStatusText(trip.status),
            };
        }));
        },
      error: (error) => {
          console.error('Error loading upcoming trips:', error);
          this.alertService.error('Erreur de chargement des trajets à venir');
        },
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      planifie: 'Scheduled',
      embarquement: 'Boarding',
      en_route: 'In Transit',
      termine: 'Completed',
      annule: 'Cancelled',
    };
    return statusMap[status] || status;
  }

  viewTripDetails(trip: any): void {
    this.router.navigate(['/trajet-manifeste', trip.id]);
  }

  manageTrip(trip: any): void {
    this.router.navigate(['/ajout-trajet', trip.id]);
  }

  addNewTrip(): void {
    this.router.navigate(['/ajout-trajet']);
  }

  onSortChange(event: { key: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }
}

