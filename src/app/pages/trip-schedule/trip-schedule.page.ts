import { Component, OnInit } from '@angular/core';
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
  todayDepartures: any[] = [];
  upcomingTrips: any[] = [];
  nextDeparture: any | null = null;
  isLoading = false;
  private pendingLoadingRequests = 0;

  departureColumns: TableColumn[] = [
    { key: 'departureTime', title: 'Time & Date', sortable: true },
    { key: 'route', title: 'Route', sortable: true },
    { key: 'bus', title: 'Assigned Bus', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
  ];

  upcomingColumns: TableColumn[] = [
    { key: 'id', title: 'ID' },
    { key: 'departureTime', title: 'Time' },
    { key: 'route', title: 'Route' },
    { key: 'bus', title: 'Bus' },
    { key: 'status', title: 'Status' },
  ];

  departureActions: TableAction[] = [
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
  ];

  constructor(
    private partnerApiService: PartnerApiService,
    private router: Router,
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

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.beginLoading();
    this.partnerApiService
      .getTodaysTrips()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (trips: Trip[]) => {
          this.todayDepartures = trips.map((trip) => {
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
          });
          this.nextDeparture = this.todayDepartures.length ? this.todayDepartures[0] : null;
        },
        (error) => {
          console.error('Error loading today trips:', error);
          this.alertService.error('Erreur de chargement des départs du jour');
        },
      );

    this.beginLoading();
    this.partnerApiService
      .getTrips()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(
        (trips: Trip[]) => {
          this.upcomingTrips = trips.slice(0, 5).map((trip) => {
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
          });
        },
        (error) => {
          console.error('Error loading upcoming trips:', error);
          this.alertService.error('Erreur de chargement des trajets à venir');
        },
      );
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
    this.router.navigate(['/ajout-trajet', trip.id]);
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
