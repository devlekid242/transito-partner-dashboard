import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AgencyDocument, BusPoint, ManifestData, Trip } from '../models/partner.model';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TicketValidationResponse {
  success: boolean;
  ticketNumber: string;
  passengerName: string;
  boardingStatus: 'VALID' | 'ALREADY_BOARDED' | 'NOT_FOUND' | 'CANCELLED';
  message: string;
  boardingTime?: string;
}

// export interface ManifestData {
//   tripId: number;
//   busInfo: {
//     id: number;
//     licensePlate: string;
//     capacity: number;
//     model: string;
//   };
//   passengers: Array<{
//     id: number;
//     name: string;
//     seatNumber: number;
//     ticketNumber: string;
//     boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW';
//     phoneNumber: string;
//   }>;
//   departure: string;
//   arrival: string;
//   departureTime: string;
// }

export interface PartnerProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  prefNotifications: number;
  prefLanguage: string;
  prefDarkMode: number;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  agent: any;
}

export interface Bus {
  id: number;
  registrationNumber: string;
  capacity: number;
  category: 'VIP' | 'Classique';
  status: 'disponible' | 'maintenance' | 'hors_service';
  brand?: string;
  model?: string;
  color?: string;
  acquisitionDate?: string;
  mileage?: number;
  lastMaintenanceDate?: string;
  createdAt: string;
  agency?: {
    id: number;
    name?: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
    description?: string;
    status?: string;
    ratingCache?: string;
    createdAt?: string;
  };
}

export interface Notification {
  id: number;
  recipientType: string;
  recipientId: number | null;
  type: string;
  category?: string;
  title: string;
  message: string;
  time?: string;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerApiService {
  private apiUrl = environment.apiUrl; // use configured API base

  constructor(private http: HttpClient) {}

  // ============= TRIPS =============

  getTrips(status?: 'active' | 'scheduled' | 'completed'): Observable<Trip[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status.toLowerCase());
    }
    return this.http.get<any>(`${this.apiUrl}/trips`, { params }).pipe(map((r) => r.data ?? r));
  }

  getTripDetails(tripId: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/trips/${tripId}`);
  }

  createTrip(tripData: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(`${this.apiUrl}/trips`, tripData);
  }

  updateTrip(tripId: number, updates: Partial<Trip>): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/trips/${tripId}`, updates);
  }

  deleteTrip(tripId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/trips/${tripId}`,
    );
  }

  cancelTrip(tripId: number, reason: string): Observable<{ success: boolean; message: string }> {
    // API doesn't expose a dedicated cancel endpoint; update status via PUT
    return this.http
      .put<any>(`${this.apiUrl}/trips/${tripId}`, {
        status: 'annule',
        cancelReason: reason,
      })
      .pipe(map(() => ({ success: true, message: 'Trip cancelled' })));
  }

  // ============= TICKETS =============

  validateTicket(
    ticketIdentifier: string | number,
    agentId?: number,
  ): Observable<TicketValidationResponse> {
    let id: number;
    if (typeof ticketIdentifier === 'number') {
      id = ticketIdentifier;
    } else {
      const m = String(ticketIdentifier).match(/\d+/);
      id = m ? parseInt(m[0], 10) : NaN;
    }

    if (!id || isNaN(id)) {
      return this.http.post<TicketValidationResponse>(`${this.apiUrl}/tickets/validate`, {
        qrCode: ticketIdentifier,
      } as any);
    }

    const body: any = {};
    if (agentId) body.agentId = agentId;
    return this.http.patch<any>(`${this.apiUrl}/tickets/${id}/validate`, body).pipe(
      map(
        () =>
          ({
            success: true,
            ticketNumber: `TKT-${id}`,
            passengerName: '',
            boardingStatus: 'VALID',
            message: 'Validé',
            boardingTime: new Date().toISOString(),
          }) as TicketValidationResponse,
      ),
    );
  }

  getValidationStats(tripId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/trips/${tripId}/validation-stats`);
  }

  // ============= MANIFESTS =============

  getTripManifest(tripId: number): Observable<ManifestData> {
    return forkJoin({
      trip: this.getTripDetails(tripId),
      tickets: this.http.get<any[]>(`${this.apiUrl}/tickets`, {
        params: new HttpParams().set('trip_id', String(tripId)),
      }),
    }).pipe(
      map(({ trip, tickets }) => {
        const processedPassengers = (tickets ?? []).map((t: any) => ({
          id: t.id,
          name: t.passengerName || t.name || 'Invité',
          seatNumber: Number(t.seatNumber) || 0,
          ticketNumber: t.ticketNumber || `TKT-${t.id}`,
          boardingStatus:
            t.status === 'Utilisé' ? 'BOARDED' : t.status === 'Absent' ? 'NO_SHOW' : 'PENDING',
          phoneNumber: t.passengerPhone || t.phoneNumber || '',
          boardingPoint: t.boardingPoint || t.boardingLocation || trip.departureCity,
          deboardingPoint: t.deboardingPoint || t.destinationCity || trip.arrivalCity,
          price: Number(t.price) || undefined,
        }));

        const total = processedPassengers.length;
        const boarded = processedPassengers.filter((p) => p.boardingStatus === 'BOARDED').length;
        const pending = processedPassengers.filter((p) => p.boardingStatus === 'PENDING').length;
        const noShow = processedPassengers.filter((p) => p.boardingStatus === 'NO_SHOW').length;
        const cancelled = processedPassengers.filter(
          (p) => p.boardingStatus === 'CANCELLED',
        ).length;

        return {
          tripId,
          departure: trip.departureCity ?? '',
          arrival: trip.arrivalCity ?? '',
          departureTime: trip.departureTime ?? '',
          arrivalTime: trip.estimatedArrivalTime ?? '',
          route: {
            departure: trip.departureCity ?? '',
            arrival: trip.arrivalCity ?? '',
            departurePoint: trip.departurePoint?.name ?? '',
            arrivalPoint: trip.arrivalPoint?.name ?? '',
            departureDateTime: trip.departureTime ?? '',
            arrivalDateTime: trip.estimatedArrivalTime ?? '',
          },
          status: trip.status,
          notes: trip.notes ?? '',
          busInfo: {
            id: trip.bus?.id ?? 0,
            licensePlate: trip.bus?.registrationNumber ?? '',
            capacity: trip.bus?.capacity ?? 0,
            model: `${trip.bus?.brand ?? ''} ${trip.bus?.model ?? ''}`.trim(),
            image: trip.bus?.photoUrl || trip.bus?.imageUrl || '',
            photoUrl: trip.bus?.photoUrl || trip.bus?.imageUrl || '',
          },
          driver: {
            name: trip.driverName ?? '',
            license: trip.driverLicense ?? '',
            phone: trip.driverPhone ?? '',
            experience: trip.driverExperience ?? '',
            photo: trip.driverPhotoUrl ?? '',
          },
          hostess: {
            name: trip.hostessName ?? '',
            phone: trip.hostessPhone ?? '',
            photo: trip.hostessPhotoUrl ?? '',
          },
          passengers: processedPassengers,
          stops:
            trip.boardingPoints?.map((point: any, index: number) => ({
              location: point.name || `Étape ${index + 1}`,
              time: point.time ?? '',
              status: 'Programmé',
              completed: false,
              current: index === 0,
            })) ?? [],
          stats: {
            total,
            boarded,
            pending,
            noShow,
            cancelled,
            occupancyRate: total ? Math.round((boarded / total) * 100) : 0,
          },
        } as ManifestData;
      }),
    );
  }

  generateManifestPDF(tripId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/trips/${tripId}/manifest/pdf`, {
      responseType: 'blob',
    });
  }

  // ============= PROFILE =============

  getPartnerProfile(): Observable<PartnerProfile> {
    return this.http.get<PartnerProfile>(`${this.apiUrl}/users/me`);
  }

  updatePartnerProfile(
    updates: Partial<PartnerProfile> | Record<string, any>,
  ): Observable<PartnerProfile> {
    const payload: Record<string, any> = { ...updates };
    if (payload['phone'] && !payload['phoneNumber']) {
      payload['phoneNumber'] = payload['phone'];
      delete payload['phone'];
    }
    return this.http.patch<PartnerProfile>(`${this.apiUrl}/users/me`, payload);
  }

  updatePartnerPassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me/change-password`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  updateAgency(agencyId: number, updates: Record<string, any>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/agencies/${agencyId}/admin`, updates);
  }

  updateProfilePhoto(file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('profile_photo', file);
    return this.http
      .post<{ profilePhotoUrl: string }>(`${this.apiUrl}/users/me/photo`, formData)
      .pipe(map((r) => ({ photoUrl: r.profilePhotoUrl })));
  }

  getAgencyDocuments(): Observable<AgencyDocument[]> {
    return this.http.get<AgencyDocument[]>(`${this.apiUrl}/agency-documents`);
  }

  uploadAgencyDocument(
    file: File,
    metadata?: { name?: string; type?: string },
  ): Observable<AgencyDocument> {
    const formData = new FormData();
    formData.append('document', file);
    if (metadata?.name) {
      formData.append('name', metadata.name);
    }
    if (metadata?.type) {
      formData.append('type', metadata.type);
    }
    return this.http.post<AgencyDocument>(`${this.apiUrl}/agency-documents`, formData);
  }

  uploadAgencyImage(agencyId: number, file: File, imageType: 'banner' | 'logo'): Observable<any> {
    const formData = new FormData();
    formData.append(imageType, file);
    return this.http.post<any>(`${this.apiUrl}/agencies/${agencyId}/upload-images`, formData);
  }

  deleteAgencyDocument(documentId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/agency-documents/${documentId}`);
  }

  // ============= BUSES =============

  getBuses(): Observable<Bus[]> {
    return this.http.get<Bus[]>(`${this.apiUrl}/buses/agency`);
  }

  getMaintenanceSchedule(): Observable<Bus[]> {
    return this.http.get<Bus[]>(`${this.apiUrl}/buses/maintenance-schedule`);
  }

  getBusDetails(busId: number): Observable<Bus> {
    return this.http.get<Bus>(`${this.apiUrl}/buses/${busId}`);
  }

  addBus(busData: Partial<Bus>): Observable<Bus> {
    return this.http.post<Bus>(`${this.apiUrl}/buses`, busData);
  }

  updateBus(busId: number, updates: Partial<Bus>): Observable<Bus> {
    return this.http.put<Bus>(`${this.apiUrl}/buses/${busId}`, updates);
  }

  deleteBus(busId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/buses/${busId}`);
  }

  // ============= BUS POINTS =============
  getBusPoints(agencyId?: number): Observable<BusPoint[]> {
    let params = new HttpParams();
    if (agencyId) params = params.set('agency_id', String(agencyId));
    return this.http.get<BusPoint[]>(`${this.apiUrl}/agency-points`, { params });
  }

  addBusPoint(pointData: Partial<BusPoint>): Observable<BusPoint> {
    return this.http.post<BusPoint>(`${this.apiUrl}/agency-points`, pointData);
  }

  getBusPointDetail(pointId: number): Observable<BusPoint> {
    return this.http.get<BusPoint>(`${this.apiUrl}/agency-points/${pointId}`);
  }

  updateBusPoint(pointId: number, updates: Partial<BusPoint>): Observable<BusPoint> {
    return this.http.patch<BusPoint>(`${this.apiUrl}/agency-points/${pointId}`, updates);
  }

  deleteBusPoint(pointId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/agency-points/${pointId}`,
    );
  }

  // ============= NOTIFICATIONS =============
  getNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.apiUrl}/user-notifications`).pipe(
      map((r: any) => (r.data ?? r) as any[]),
      map((notifications: any[]) =>
        notifications.map((notification: any) => {
          const category = (notification.category ?? notification.type ?? 'INFO').toUpperCase();
          return {
            id: notification.id,
            recipientType: notification.recipientType,
            recipientId: notification.recipientId ?? null,
            type: category,
            category,
            title: notification.title,
            message: notification.message,
            time: notification.createdAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            isRead: notification.isRead,
            read: notification.isRead,
            payload: notification.payload,
          } as Notification;
        }),
      ),
    );
  }

  markNotificationAsRead(notificationId: number): Observable<{ success: boolean }> {
    return this.http
      .patch<any>(`${this.apiUrl}/user-notifications/${notificationId}/read`, {} as any)
      .pipe(map(() => ({ success: true })));
  }

  markAllNotificationsAsRead(): Observable<{ success: boolean }> {
    return this.http
      .patch<any>(`${this.apiUrl}/user-notifications/mark-all-read`, {} as any)
      .pipe(map(() => ({ success: true })));
  }

  deleteNotification(notificationId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/notifications/${notificationId}`);
  }

  // ============= STATISTICS & REPORTS =============

  getPartnerStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports`);
  }

  downloadReport(reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}/download`, {
      responseType: 'blob',
    });
  }

  generateReport(filter: { category: string; dateRange: string }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/generate`, filter, {
      responseType: 'blob',
    });
  }

  getRevenue(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams().set('start', startDate).set('end', endDate);
    return this.http.get(`${this.apiUrl}/revenue`, { params });
  }

  createWithdrawal(withdrawal: {
    amount: number;
    paymentMethod: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/partner/withdrawals`, withdrawal);
  }

  getWithdrawals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/partner/withdrawals`);
  }

  getWithdrawal(withdrawalId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/partner/withdrawals/${withdrawalId}`);
  }

  getTransactionStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/partner/transactions/stats`);
  }

  generateTripReport(tripId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/trips/${tripId}/report`, {
      responseType: 'blob',
    });
  }

  // ============= RECEIPTS =============
  getPaymentReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });
  }

  getReservationReceipt(reservationId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/bookings/${reservationId}/receipt`, {
      responseType: 'blob',
    });
  }

  // ============= HELPER METHODS =============

  getUnreadNotificationCount(): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.apiUrl}/user-notifications/unread/count`)
      .pipe(map((r) => r.count ?? 0));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me/change-password`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  getTodaysTrips(): Observable<Trip[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.http
      .get<any>(`${this.apiUrl}/trips`, { params: new HttpParams().set('trip_date', today) })
      .pipe(map((r) => r.data ?? r));
  }

  searchTrips(departure: string, arrival: string, date: string): Observable<Trip[]> {
    const params = new HttpParams()
      .set('departure_city', departure)
      .set('arrival_city', arrival)
      .set('trip_date', date);
    return this.http.get<any>(`${this.apiUrl}/trips`, { params }).pipe(map((r) => r.data ?? r));
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/trips/cities/departure`);
  }

  getRecentBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/recent`);
  }

  /**
   * Try to fetch staff/users associated with the partner.
   * Tries common endpoints and falls back to empty array on error.
   */
  getStaffMembers(agencyId?: number): Observable<any[]> {
    const params = agencyId ? new HttpParams().set('agency_id', String(agencyId)) : undefined;
    return this.http
      .get<any>(`${this.apiUrl}/users`, { params })
      .pipe(map((r) => r.data ?? r ?? []));
  }

  getBusTypes(): Observable<SelectOption[]> {
    return this.getBuses().pipe(
      map((buses) => {
        const types = Array.from(new Set(buses.map((bus: any) => bus.category).filter(Boolean)));
        return types.length
          ? types.map((type: string) => ({ value: type, label: type }))
          : [
              { value: 'VIP', label: 'VIP (Wi-Fi, Climatisation)' },
              { value: 'Classique', label: 'Classique' },
            ];
      }),
    );
  }

  getPointTypes(): Observable<SelectOption[]> {
    return of([
      { value: 'principal', label: 'Agence Principale' },
      { value: 'premium', label: 'Kiosque Premium' },
      { value: 'express', label: 'Guichet Express' },
      { value: 'crossborder', label: 'Agence Transfrontalière' },
    ]);
  }

  getPaymentMethods(): Observable<SelectOption[]> {
    return of([
      { value: '', label: 'Sélectionnez une méthode', disabled: true },
      { value: 'bank', label: 'Virement Bancaire' },
      { value: 'momo', label: 'Mobile Money (Orange)' },
      { value: 'momo_mtn', label: 'Mobile Money (MTN)' },
    ]);
  }

  getStatusOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'Active', label: 'Active' },
      { value: 'Invited', label: 'Invited' },
      { value: 'Inactive', label: 'Inactive' },
    ]);
  }

  getAgencyPointStatusOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' },
    ]);
  }

  getRoleOptions(): Observable<SelectOption[]> {
    return of([
      {
        value: 'admin',
        label: 'Admin',
        icon: 'admin_panel_settings',
        description: 'Accès total au système',
      },
      {
        value: 'manager',
        label: 'Manager',
        icon: 'manage_accounts',
        description: 'Gestion flotte et trajets',
      },
      { value: 'staff', label: 'Staff', icon: 'person', description: 'Accès limité (lecture)' },
    ] as any);
  }

  // ============= AGENCIES & USER REGISTRATION =============
  getAgencies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agencies`).pipe(map((r) => r ?? []));
  }

  registerUser(payload: {
    fullName: string;
    email?: string | null;
    phoneNumber: string;
    password?: string;
    agent?: {
      agencyId?: number | null;
      agentRole?: string;
      status?: string;
    } | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/staff`, payload);
  }

  getTripStatusOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'planifie', label: 'Planifié' },
      { value: 'embarquement', label: 'Embarquement' },
      { value: 'en_route', label: 'En route' },
      { value: 'termine', label: 'Terminé' },
      { value: 'annule', label: 'Annulé' },
    ]);
  }

  getLanguageOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
    ]);
  }

  getThemeOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'light', label: 'Clair' },
      { value: 'dark', label: 'Sombre' },
    ]);
  }

  getDateRangeOptions(): Observable<SelectOption[]> {
    return of([
      { value: '30', label: 'Derniers 30 Jours' },
      { value: 'month', label: 'Ce Mois' },
      { value: 'quarter', label: 'Trimestre en cours' },
      { value: 'year', label: 'Année en cours' },
      { value: 'custom', label: 'Personnalisé...' },
    ]);
  }

  getReportCategoryOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'all', label: 'Tous les Rapports' },
      { value: 'financial', label: 'Financier' },
      { value: 'operational', label: 'Opérationnel' },
      { value: 'passenger', label: 'Passagers' },
    ]);
  }

  getTransactionTypeOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'all', label: 'All Types' },
      { value: 'revenue', label: 'Revenue' },
      { value: 'payout', label: 'Payout' },
      { value: 'fee', label: 'Fee' },
    ]);
  }

  getManifestStatusOptions(): Observable<SelectOption[]> {
    return of([
      { value: 'all', label: 'Tous les statuts' },
      { value: 'boarded', label: 'Embarqué' },
      { value: 'pending', label: 'En attente' },
      { value: 'cancelled', label: 'Annulé' },
    ]);
  }
}
