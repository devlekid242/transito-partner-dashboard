import { Injectable, signal, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, forkJoin, of, throwError } from "rxjs";
import { map, tap, catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { unwrapCollection } from "../shared/rxjs-operators";
import {
	AgencyDocument,
	BusPoint,
	ManifestData,
	Trip,
	Bus,
	PartnerProfile,
	Notification,
	TicketValidationResponse,
	SelectOption,
	PointEmbarquement,
	Trajet,
	Reservation,
	Retrait,
	Transaction,
	NotificationItem,
	Utilisateur,
	Agence,
  RevenueChartResponse,
	KpiData,
} from "../models";

@Injectable({
	providedIn: "root",
})
export class PartnerApiService {
	private http = inject(HttpClient);
	private apiUrl = environment.apiUrl;

	// Signal stores for V2 components reactivity
	// Initialisés vides pour forcer le chargement depuis l'API
	readonly bus = signal<Bus[]>([]);
	readonly pointsEmbarquement = signal<PointEmbarquement[]>([]);
	readonly trajets = signal<Trajet[]>([]);
	readonly reservations = signal<Reservation[]>([]);
	readonly retraits = signal<Retrait[]>([]);
	readonly transactions = signal<Transaction[]>([]);
	readonly notifications = signal<NotificationItem[]>([]);
	readonly staff = signal<Utilisateur[]>([]);
	// Initialize with an empty object to simplify template null-checks
	readonly agence = signal<Agence>({} as Agence);
	readonly kpi = signal<KpiData | null>(null);
	readonly revenueChart = signal<{ labels: string[]; data: number[] }>({
		labels: [],
		data: [],
	});

	// Loading states pour chaque type de donnée
	readonly isLoadingBus = signal<boolean>(false);
	readonly isLoadingPoints = signal<boolean>(false);
	readonly isLoadingTrips = signal<boolean>(false);
	readonly isLoadingNotifications = signal<boolean>(false);
	readonly isLoadingWithdrawals = signal<boolean>(false);
	readonly isLoadingStaff = signal<boolean>(false);

	constructor() {
		this.refreshAllData();
	}

	refreshAllData(): void {
		// Load all shared partner data once so every V2 screen consumes live API state.
		this.getPartnerProfile().subscribe({
			next: (profile) => {
				const agency = profile?.agence || (profile as any)?.agency;
				if (agency) this.setAgence(agency as Agence);
			},
			error: (err) =>
				console.error("Error loading partner profile:", err),
		});

		this.getPartnerStats().subscribe({
			next: (stats) => this.setKpiFromStats(stats),
			error: (err) =>
				console.error("Error loading partner statistics:", err),
		});

		this.getRecentBookings().subscribe({
			next: (bookings) => this.setReservationsFromBookings(bookings),
			error: (err) =>
				console.error("Error loading recent bookings:", err),
		});

		this.isLoadingBus.set(true);
		this.getBuses().subscribe({
			next: (buses) => {
				this.bus.set(buses ?? []);
				this.isLoadingBus.set(false);
			},
			error: (err) => {
				console.error("Error loading buses:", err);
				this.isLoadingBus.set(false);
				this.bus.set([]);
			},
		});

		this.isLoadingPoints.set(true);
		this.getBusPoints().subscribe({
			next: (pts) => {
				this.pointsEmbarquement.set((pts as PointEmbarquement[]) ?? []);
				this.isLoadingPoints.set(false);
			},
			error: (err) => {
				console.error("Error loading bus points:", err);
				this.isLoadingPoints.set(false);
				this.pointsEmbarquement.set([]);
			},
		});

		this.isLoadingTrips.set(true);
		this.getTrips().subscribe({
			next: (trps) => {
				this.trajets.set((trps as Trajet[]) ?? []);
				this.isLoadingTrips.set(false);
			},
			error: (err) => {
				console.error("Error loading trips:", err);
				this.isLoadingTrips.set(false);
				this.trajets.set([]);
			},
		});

		this.isLoadingNotifications.set(true);
		this.getNotifications().subscribe({
			next: (notifs) => {
				this.notifications.set((notifs as NotificationItem[]) ?? []);
				this.isLoadingNotifications.set(false);
			},
			error: (err) => {
				console.error("Error loading notifications:", err);
				this.isLoadingNotifications.set(false);
				this.notifications.set([]);
			},
		});

		this.isLoadingWithdrawals.set(true);
		this.getWithdrawals().subscribe({
			next: (w) => {
				this.retraits.set(w ?? []);
				this.isLoadingWithdrawals.set(false);
			},
			error: (err) => {
				console.error("Error loading withdrawals:", err);
				this.isLoadingWithdrawals.set(false);
				this.retraits.set([]);
			},
		});

		this.isLoadingStaff.set(true);
		this.getStaffMembers().subscribe({
			next: (st) => {
				this.staff.set(st ?? []);
				this.isLoadingStaff.set(false);
			},
			error: (err) => {
				console.error("Error loading staff:", err);
				this.isLoadingStaff.set(false);
				this.staff.set([]);
			},
		});
	}

	private setKpiFromStats(stats: any): void {
		const source = stats?.data ?? stats?.statistics ?? stats ?? {};
		const revenue = Number(
			source.revenueToday ??
				source.revenusAujourdhui ??
				source.netRevenue ??
				0,
		);
		const activeTrips = Number(
			source.activeTrips ?? source.trajetsActifs ?? 0,
		);
		const passengers = Number(
			source.totalPassengers ?? source.passagersTotaux ?? 0,
		);
		const monthlyRevenue = source.monthlyRevenue ?? source.revenusMois;
		const occupancy = Number(
			source.occupancyRate ??
				source.tauxOccupation ??
				source.fillRate ??
				0,
		);

		this.kpi.set({
			revenusAujourdhui: revenue,
			trajetsActifs: Number.isFinite(activeTrips) ? activeTrips : 0,
			passagersTotaux: Number.isFinite(passengers) ? passengers : 0,
			revenusMois: monthlyRevenue == null ? null : Number(monthlyRevenue),
			tauxOccupation: Number.isFinite(occupancy) ? occupancy : 0,
			revenueChange: Number(
				source.revenueChange ?? source.revenusChange ?? 0,
			),
			tripsChange: Number(
				source.tripsChange ?? source.trajetsChange ?? 0,
			),
			passengersChange: Number(
				source.passengersChange ?? source.passagersChange ?? 0,
			),
		});
	}

	private setReservationsFromBookings(bookings: any[]): void {
		const mapped: Reservation[] = (bookings ?? []).map((booking: any) => ({
			id: booking.id,
			reference:
				booking.reference ||
				booking.bookingReference ||
				`RES-${booking.id}`,
			passager:
				booking.passengerName ||
				booking.passenger?.fullName ||
				booking.passenger?.name ||
				"—",
			trajet:
				booking.route ||
				`${booking.departureCity || "—"} → ${booking.arrivalCity || "—"}`,
			date: booking.bookingDate || booking.createdAt || "",
			montant: Number(
				booking.price ?? booking.amount ?? booking.totalAmount ?? 0,
			),
			statut:
				booking.status ||
				booking.ticketStatus ||
				booking.paymentStatus ||
				"en_attente",
		})) as Reservation[];
		this.reservations.set(mapped);
	}

	// ============= TRIPS =============

	getTrips(
		status?: "active" | "scheduled" | "completed",
	): Observable<Trip[]> {
		let params = new HttpParams();
		if (status) {
			params = params.set("status", status.toLowerCase());
		}
		return this.http.get<any>(`${this.apiUrl}/trips`, { params }).pipe(
			unwrapCollection<Trip>(),
			tap((trips) => {
				this.trajets.set((trips ?? []) as Trajet[]);
			}),
			catchError(() => of(this.trajets() as Trip[])),
		);
	}

	getTripDetails(tripId: number | string): Observable<Trip> {
		return this.http.get<Trip>(`${this.apiUrl}/trips/${tripId}`).pipe(
			catchError((err) => {
				console.error("Error loading trip details:", err);
				const found = this.trajets().find(
					(t) => String(t.id) === String(tripId),
				);
				if (found) {
					return of(found as Trip);
				}
				throw err;
			}),
		);
	}

	createTrip(tripData: Partial<Trip>): Observable<Trip> {
		return this.http.post<Trip>(`${this.apiUrl}/trips`, tripData).pipe(
			tap((newTrip) => {
				this.trajets.update((list) => [newTrip as Trajet, ...list]);
			}),
		);
	}

	updateTrip(
		tripId: number | string,
		updates: Partial<Trip>,
	): Observable<Trip> {
		return this.http
			.put<Trip>(`${this.apiUrl}/trips/${tripId}`, updates)
			.pipe(
				tap((updated) => {
					this.trajets.update((list) =>
						list.map((t) =>
							String(t.id) === String(tripId)
								? { ...t, ...updated }
								: t,
						),
					);
				}),
			);
	}

	deleteTrip(
		tripId: number | string,
	): Observable<{ success: boolean; message: string }> {
		return this.http
			.delete<{
				success: boolean;
				message: string;
			}>(`${this.apiUrl}/trips/${tripId}`)
			.pipe(
				tap(() => {
					this.trajets.update((list) =>
						list.filter((t) => String(t.id) !== String(tripId)),
					);
				}),
			);
	}

	cancelTrip(
		tripId: number | string,
		reason: string,
	): Observable<{ success: boolean; message: string }> {
		return this.http
			.put<any>(`${this.apiUrl}/trips/${tripId}`, {
				status: "annule",
				cancelReason: reason,
			})
			.pipe(
				map(() => ({ success: true, message: "Trip cancelled" })),
				tap(() => {
					this.trajets.update((list) =>
						list.map((t) =>
							String(t.id) === String(tripId)
								? { ...t, status: "annule" }
								: t,
						),
					);
				}),
			);
	}

	// ============= TICKETS =============

	validateTicket(
		ticketIdentifier: string | number,
		agentId?: number,
	): Observable<TicketValidationResponse> {
		let id: number;
		if (typeof ticketIdentifier === "number") {
			id = ticketIdentifier;
		} else {
			const m = String(ticketIdentifier).match(/\d+/);
			id = m ? parseInt(m[0], 10) : NaN;
		}

		if (!id || isNaN(id)) {
			return this.http.post<TicketValidationResponse>(
				`${this.apiUrl}/tickets/validate`,
				{
					qrCode: ticketIdentifier,
				} as any,
			);
		}

		const body: any = {};
		if (agentId) body.agentId = agentId;
		return this.http
			.patch<any>(`${this.apiUrl}/tickets/${id}/validate`, body)
			.pipe(
				map(
					(response) =>
						({
							success: true,
							ticketNumber: response.ticketNumber || `TKT-${id}`,
							passengerName:
								response.passengerName || "Passager Validé",
							boardingStatus: response.boardingStatus || "VALID",
							message:
								response.message || "Billet validé avec succès",
							boardingTime:
								response.boardingTime ||
								new Date().toISOString(),
						}) as TicketValidationResponse,
				),
				catchError((err) => {
					console.error("Error validating ticket:", err);
					throw err;
				}),
			);
	}

	getValidationStats(tripId: number | string): Observable<any> {
		return this.http.get(`${this.apiUrl}/trips/${tripId}/validation-stats`);
	}

	// ============= MANIFESTS =============

	getTripManifest(tripId: number | string): Observable<ManifestData> {
		const numId = Number(tripId) || 1;
		return forkJoin({
			trip: this.getTripDetails(tripId),
			tickets: this.http
				.get<any[]>(`${this.apiUrl}/tickets`, {
					params: new HttpParams().set("trip_id", String(tripId)),
				})
				.pipe(
					unwrapCollection<any>(),
					catchError(() => of([])),
				),
		}).pipe(
			map(({ trip, tickets }) => {
				const processedPassengers = (tickets || []).map((t: any) => {
					const statusCode = String(
						t.statusCode || t.status || "",
					).toLowerCase();
					let boardingStatus:
						| "BOARDED"
						| "PENDING"
						| "NO_SHOW"
						| "CANCELLED" = "PENDING";

					if (
						statusCode === "embarque" ||
						statusCode === "boarded" ||
						statusCode === "utilisé" ||
						statusCode === "used"
					) {
						boardingStatus = "BOARDED";
					} else if (
						statusCode === "annule" ||
						statusCode === "cancelled"
					) {
						boardingStatus = "CANCELLED";
					} else if (
						statusCode === "absent" ||
						statusCode === "no_show" ||
						statusCode === "no-show"
					) {
						boardingStatus = "NO_SHOW";
					}

					return {
						id: t.id,
						name: t.passengerName || t.name || "Invité",
						seatNumber: Number(t.seatNumber) || 1,
						ticketNumber: t.ticketNumber || `TKT-${t.id}`,
						boardingStatus,
						phoneNumber: t.passengerPhone || t.phoneNumber || "",
						boardingPoint:
							t.boardingPoint ||
							t.boardingLocation ||
							trip.departureCity,
						deboardingPoint:
							t.deboardingPoint ||
							t.destinationCity ||
							trip.arrivalCity,
						price: Number(t.price) || undefined,
					};
				});

				// Utiliser les passagers tels quels depuis l'API
				const finalPassengers = processedPassengers;

				const total = finalPassengers.length;
				const boarded = finalPassengers.filter(
					(p) => p.boardingStatus === "BOARDED",
				).length;
				const pending = finalPassengers.filter(
					(p) => p.boardingStatus === "PENDING",
				).length;
				const noShow = finalPassengers.filter(
					(p) => p.boardingStatus === "NO_SHOW",
				).length;
				const cancelled = finalPassengers.filter(
					(p) => p.boardingStatus === "CANCELLED",
				).length;

				return {
					tripId: numId,
					departure: trip.departureCity ?? "",
					arrival: trip.arrivalCity ?? "",
					departureTime: trip.departureTime ?? "07:00",
					arrivalTime: trip.estimatedArrivalTime ?? "11:30",
					route: {
						departure: trip.departureCity ?? "",
						arrival: trip.arrivalCity ?? "",
						departurePoint: trip.departurePoint?.name ?? "",
						arrivalPoint: trip.arrivalPoint?.name ?? "",
						departureDateTime: trip.departureTime ?? "07:00",
						arrivalDateTime: trip.estimatedArrivalTime ?? "11:30",
					},
					status: (trip.status as any) ?? "en_cours",
					notes: trip.notes ?? "",
					busInfo: {
						id: trip.bus?.id ?? 1,
						licensePlate:
							trip.bus?.registrationNumber ||
							trip.bus?.immatriculation ||
							"",
						capacity: trip.bus?.capacity || trip.bus?.capacite || 0,
						model: `${trip.bus?.brand || ""} ${trip.bus?.model || trip.bus?.modele || ""}`.trim(),
						image: trip.bus?.photoUrl || trip.bus?.imageUrl || "",
						photoUrl:
							trip.bus?.photoUrl || trip.bus?.imageUrl || "",
					},
					driver: {
						name: trip.driverName ?? "",
						license: trip.driverLicense ?? "",
						phone: trip.driverPhone ?? "",
						experience: trip.driverExperience ?? "",
						photo: trip.driverPhotoUrl ?? "",
					},
					hostess: {
						name: trip.hostessName ?? "",
						phone: trip.hostessPhone ?? "",
						photo: trip.hostessPhotoUrl ?? "",
					},
					passengers: finalPassengers,
					stops: (trip.boardingPoints || []).map(
						(point: any, index: number) => ({
							location: point.name || `Étape ${index + 1}`,
							time: point.time ?? "",
							status: "Programmé",
							completed: false,
							current: index === 0,
						}),
					),
					stats: {
						total,
						boarded,
						pending,
						noShow,
						cancelled,
						occupancyRate: total
							? Math.round((boarded / total) * 100)
							: 0,
					},
				} as ManifestData;
			}),
		);
	}

	generateManifestPDF(tripId: number | string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/trips/${tripId}/manifest/pdf`, {
			responseType: "blob",
		});
	}

	// ============= PROFILE & AGENCY =============

	getPartnerProfile(): Observable<PartnerProfile> {
		return this.http.get<PartnerProfile>(`${this.apiUrl}/users/me`);
	}

	updatePartnerProfile(
		updates: Partial<PartnerProfile> | Record<string, any>,
	): Observable<PartnerProfile> {
		const payload: Record<string, any> = { ...updates };
		if (payload["phone"] && !payload["phoneNumber"]) {
			payload["phoneNumber"] = payload["phone"];
			delete payload["phone"];
		}
		return this.http.patch<PartnerProfile>(
			`${this.apiUrl}/users/me`,
			payload,
		);
	}

	updatePartnerPassword(
		oldPassword: string,
		newPassword: string,
	): Observable<any> {
		return this.http.put(`${this.apiUrl}/users/me/change-password`, {
			old_password: oldPassword,
			new_password: newPassword,
		});
	}

	updateAgency(
		agencyId: number | string,
		updates: Record<string, any>,
	): Observable<any> {
		return this.http
			.put<any>(`${this.apiUrl}/agencies/${agencyId}/admin`, updates)
			.pipe(
				tap(() => {
					this.agence.update((curr) => ({ ...curr, ...updates }));
				}),
			);
	}

	updateAgencyProfile(updates: Partial<Agence>): Observable<Agence | null> {
		const agency = this.agence();
		if (!agency?.id) {
			return of(agency);
		}
		return this.http
			.patch<Agence>(`${this.apiUrl}/agencies/${agency.id}`, updates)
			.pipe(
				tap((updatedAgency) => {
					this.agence.set({ ...agency, ...updatedAgency });
				}),
			);
	}

	setAgence(agency: Agence): void {
		this.agence.set(agency);
	}

	getAnalyticsReport(period: string = "30j"): Observable<any> {
		// Le backend expose les analytics partenaires sous /api/partner/analytics.
		// L'ancien frontend appelait /api/analytics/report, route inexistante.
		const now = new Date();
		const from = new Date(now);

		switch (period) {
			case "7j":
				from.setDate(from.getDate() - 7);
				break;
			case "12m":
				from.setMonth(from.getMonth() - 12);
				break;
			case "30j":
			default:
				from.setDate(from.getDate() - 30);
				break;
		}

		const params = new HttpParams()
			.set("from", from.toISOString())
			.set("to", now.toISOString());

		return forkJoin({
			analytics: this.http.get<any>(`${this.apiUrl}/partner/analytics`, {
				params,
			}),
			routes: this.http.get<any[]>(
				`${this.apiUrl}/partner/analytics/routes`,
				{ params },
			),
		}).pipe(
			map(({ analytics, routes }) => {
				const trips = analytics?.operations?.trips ?? {};
				const totalTrips = Number(trips.total ?? 0);
				const cancelledTrips = Number(trips.annule ?? 0);
				const cancellationRate =
					totalTrips > 0 ? (cancelledTrips / totalTrips) * 100 : 0;
				const dailyNetSales = analytics?.dailyNetSales ?? {};

				// Regroupe les ventes journalières par mois pour alimenter le graphique
				// historique du back-office sans inventer de données.
				const monthlyMap = new Map<string, number>();
				Object.entries(dailyNetSales).forEach(([date, amount]) => {
					const month = date.slice(0, 7);
					monthlyMap.set(
						month,
						(monthlyMap.get(month) ?? 0) + Number(amount ?? 0),
					);
				});

				const monthlyData = Array.from(monthlyMap.entries())
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([month, revenue]) => ({
						month,
						revenue,
						// Le endpoint analytics actuel ne fournit pas les réservations par mois.
						// On laisse explicitement 0 plutôt que de fabriquer une statistique.
						reservations: 0,
					}));

				return {
					...analytics,
					totalRevenue: Number(
						analytics?.finance?.salesNetOfPlatformFee ?? 0,
					),
					totalTrips,
					fillRate: Number(analytics?.operations?.fillRate ?? 0),
					cancellationRate,
					revenueTrend: 0,
					fillRateTrend: 0,
					tripsTrend: 0,
					cancellationTrend: 0,
					revenueByRoute: (routes ?? []).map((route: any) => ({
						route: `${route.departure ?? "—"} → ${route.arrival ?? "—"}`,
						revenue: Number(route.revenue ?? 0),
						tickets: Number(route.tickets ?? 0),
					})),
					monthlyData,
					busPerformance: [],
				};
			}),
		);
	}

	updateProfilePhoto(file: File): Observable<{ photoUrl: string }> {
		const formData = new FormData();
		formData.append("profile_photo", file);
		return this.http
			.post<{
				profilePhotoUrl: string;
			}>(`${this.apiUrl}/users/me/photo`, formData)
			.pipe(map((r) => ({ photoUrl: r.profilePhotoUrl })));
	}

	getAgencyDocuments(): Observable<AgencyDocument[]> {
		return this.http
			.get<any>(`${this.apiUrl}/agency-documents`)
			.pipe(unwrapCollection<AgencyDocument>());
	}

	uploadAgencyDocument(
		file: File,
		metadata?: { name?: string; type?: string },
	): Observable<AgencyDocument> {
		const formData = new FormData();
		formData.append("document", file);
		if (metadata?.name) {
			formData.append("name", metadata.name);
		}
		if (metadata?.type) {
			formData.append("type", metadata.type);
		}
		return this.http.post<AgencyDocument>(
			`${this.apiUrl}/agency-documents`,
			formData,
		);
	}

	uploadAgencyImage(
		agencyId: number | string,
		file: File,
		imageType: "banner" | "logo",
	): Observable<any> {
		const formData = new FormData();
		formData.append(imageType, file);
		return this.http.post<any>(
			`${this.apiUrl}/agencies/${agencyId}/upload-images`,
			formData,
		);
	}

	deleteAgencyDocument(
		documentId: number | string,
	): Observable<{ success: boolean }> {
		return this.http.delete<{ success: boolean }>(
			`${this.apiUrl}/agency-documents/${documentId}`,
		);
	}

	// ============= BUSES =============

	getBuses(): Observable<Bus[]> {
		return this.http.get<any>(`${this.apiUrl}/buses/agency`).pipe(
			unwrapCollection<Bus>(),
			tap((buses) => {
				this.bus.set(buses ?? []);
			}),
			catchError(() => of(this.bus())),
		);
	}

	getMaintenanceSchedule(): Observable<Bus[]> {
		return this.http
			.get<any>(`${this.apiUrl}/buses/maintenance-schedule`)
			.pipe(
				unwrapCollection<Bus>(),
				catchError(() => of([])),
			);
	}

	getBusDetails(busId: number | string): Observable<Bus> {
		return this.http.get<Bus>(`${this.apiUrl}/buses/${busId}`).pipe(
			catchError((err) => {
				console.error("Error loading bus details:", err);
				const found = this.bus().find(
					(b) => String(b.id) === String(busId),
				);
				if (found) {
					return of(found);
				}
				throw err;
			}),
		);
	}

	addBus(busData: Partial<Bus>): Observable<Bus> {
		const payload = {
			registrationNumber:
				busData.registrationNumber || busData.immatriculation,
			capacity: busData.capacity || busData.capacite,
			model: busData.model || busData.modele,
			category: busData.category,
			status: busData.status || busData.statut || "disponible",
			brand: busData.brand,
			color: busData.color,
			mileage: busData.mileage,
			acquisitionDate: busData.acquisitionDate,
			lastMaintenanceDate: busData.lastMaintenanceDate,
		};
		return this.http.post<Bus>(`${this.apiUrl}/buses`, payload).pipe(
			tap((newBus) => {
				this.bus.update((list) => [newBus as Bus, ...list]);
			}),
			catchError((err) => {
				console.error("Error creating bus:", err);
				throw err;
			}),
		);
	}

	// Alias pour compatibilité V1
	createBus(busData: Partial<Bus>): Observable<Bus> {
		return this.addBus(busData);
	}

	updateBus(busId: number | string, updates: Partial<Bus>): Observable<Bus> {
		return this.http
			.put<Bus>(`${this.apiUrl}/buses/${busId}`, updates)
			.pipe(
				tap((updated) => {
					this.bus.update((list) =>
						list.map((b) =>
							String(b.id) === String(busId)
								? { ...b, ...(updated as Bus) }
								: b,
						),
					);
				}),
				catchError((err) => {
					console.error("Error updating bus:", err);
					throw err;
				}),
			);
	}

	deleteBus(
		busId: number | string,
	): Observable<{ success: boolean; message: string }> {
		return this.http
			.delete<{
				success: boolean;
				message: string;
			}>(`${this.apiUrl}/buses/${busId}`)
			.pipe(
				tap(() => {
					this.bus.update((list) =>
						list.filter((b) => String(b.id) !== String(busId)),
					);
				}),
				catchError((err) => {
					console.error("Error deleting bus:", err);
					throw err;
				}),
			);
	}

	// ============= BUS POINTS =============

	getBusPoints(agencyId?: number | string): Observable<BusPoint[]> {
		let params = new HttpParams();
		if (agencyId) params = params.set("agency_id", String(agencyId));
		return this.http
			.get<any>(`${this.apiUrl}/agency-points`, { params })
			.pipe(
				unwrapCollection<BusPoint>(),
				tap((pts) => {
					this.pointsEmbarquement.set(
						(pts ?? []) as PointEmbarquement[],
					);
				}),
				catchError((err) => {
					console.error("Error loading bus points:", err);
					throw err;
				}),
			);
	}

	addBusPoint(pointData: Partial<BusPoint>): Observable<BusPoint> {
		return this.http
			.post<BusPoint>(`${this.apiUrl}/agency-points`, pointData)
			.pipe(
				tap((newPt) => {
					this.pointsEmbarquement.update((list) => [
						newPt as PointEmbarquement,
						...list,
					]);
				}),
				catchError((err) => {
					console.error("Error creating bus point:", err);
					throw err;
				}),
			);
	}

	getBusPointDetail(pointId: number | string): Observable<BusPoint> {
		return this.http
			.get<BusPoint>(`${this.apiUrl}/agency-points/${pointId}`)
			.pipe(
				catchError((err) => {
					console.error("Error loading bus point details:", err);
					const found = this.pointsEmbarquement().find(
						(p) => String(p.id) === String(pointId),
					);
					if (found) {
						return of(found as BusPoint);
					}
					throw err;
				}),
			);
	}

	updateBusPoint(
		pointId: number | string,
		updates: Partial<BusPoint>,
	): Observable<BusPoint> {
		return this.http
			.patch<BusPoint>(`${this.apiUrl}/agency-points/${pointId}`, updates)
			.pipe(
				tap((updated) => {
					this.pointsEmbarquement.update((list) =>
						list.map((x) =>
							String(x.id) === String(pointId)
								? { ...x, ...updated }
								: x,
						),
					);
				}),
				catchError(() => {
					this.pointsEmbarquement.update((list) =>
						list.map((x) =>
							String(x.id) === String(pointId)
								? { ...x, ...updates }
								: x,
						),
					);
					return of({ id: pointId, ...updates } as BusPoint);
				}),
			);
	}

	deleteBusPoint(
		pointId: number | string,
	): Observable<{ success: boolean; message: string }> {
		return this.http
			.delete<{
				success: boolean;
				message: string;
			}>(`${this.apiUrl}/agency-points/${pointId}`)
			.pipe(
				tap(() => {
					this.pointsEmbarquement.update((list) =>
						list.filter((x) => String(x.id) !== String(pointId)),
					);
				}),
				catchError(() => {
					this.pointsEmbarquement.update((list) =>
						list.filter((x) => String(x.id) !== String(pointId)),
					);
					return of({ success: true, message: "Point supprimé" });
				}),
			);
	}

	deletePoint(
		pointId: number | string,
	): Observable<{ success: boolean; message: string }> {
		return this.deleteBusPoint(pointId);
	}

	// ============= NOTIFICATIONS =============

	getNotifications(): Observable<Notification[]> {
		return this.http.get<any>(`${this.apiUrl}/user-notifications`).pipe(
			unwrapCollection<any>(),
			map((notifications: any[]) =>
				(notifications ?? []).map((notification: any) => {
					const category = (
						notification.category ??
						notification.type ??
						"INFO"
					).toUpperCase();
					return {
						id: notification.id,
						recipientType: notification.recipientType,
						recipientId: notification.recipientId ?? null,
						type: category,
						category,
						title: notification.title || notification.titre,
						titre: notification.title || notification.titre,
						message: notification.message,
						time: notification.createdAt,
						date: notification.createdAt,
						createdAt: notification.createdAt,
						updatedAt: notification.updatedAt,
						isRead: notification.isRead || notification.lu,
						read: notification.isRead || notification.lu,
						lu: notification.isRead || notification.lu,
						payload: notification.payload,
					} as Notification;
				}),
			),
			tap((notifs) => {
				this.notifications.set((notifs ?? []) as NotificationItem[]);
			}),
			catchError(() => of(this.notifications() as Notification[])),
		);
	}

	markNotificationAsRead(
		notificationId: number | string,
	): Observable<{ success: boolean }> {
		return this.http
			.patch<any>(
				`${this.apiUrl}/user-notifications/${notificationId}/read`,
				{} as any,
			)
			.pipe(
				map(() => ({ success: true })),
				tap(() => {
					this.notifications.update((list) =>
						list.map((n) =>
							String(n.id) === String(notificationId)
								? { ...n, lu: true, isRead: true }
								: n,
						),
					);
				}),
				catchError(() => {
					this.notifications.update((list) =>
						list.map((n) =>
							String(n.id) === String(notificationId)
								? { ...n, lu: true, isRead: true }
								: n,
						),
					);
					return of({ success: true });
				}),
			);
	}

	markAllNotificationsAsRead(): Observable<{ success: boolean }> {
		return this.http
			.patch<any>(
				`${this.apiUrl}/user-notifications/mark-all-read`,
				{} as any,
			)
			.pipe(
				map(() => ({ success: true })),
				tap(() => {
					this.notifications.update((list) =>
						list.map((n) => ({ ...n, lu: true, isRead: true })),
					);
				}),
				catchError(() => {
					this.notifications.update((list) =>
						list.map((n) => ({ ...n, lu: true, isRead: true })),
					);
					return of({ success: true });
				}),
			);
	}

	deleteNotification(
		notificationId: number | string,
	): Observable<{ success: boolean }> {
		return this.http
			.delete<{
				success: boolean;
			}>(`${this.apiUrl}/notifications/${notificationId}`)
			.pipe(
				tap(() => {
					this.notifications.update((list) =>
						list.filter(
							(n) => String(n.id) !== String(notificationId),
						),
					);
				}),
				catchError(() => {
					this.notifications.update((list) =>
						list.filter(
							(n) => String(n.id) !== String(notificationId),
						),
					);
					return of({ success: true });
				}),
			);
	}

	// ============= STATISTICS & REPORTS =============

	getPartnerStats(): Observable<any> {
		return this.http.get(`${this.apiUrl}/statistics`).pipe(
			tap((stats) => this.setKpiFromStats(stats)),
			catchError((err) => {
				console.error("Error loading partner stats:", err);
				throw err;
			}),
		);
	}

	getReports(): Observable<any[]> {
		return this.http.get<any>(`${this.apiUrl}/reports`).pipe(
			unwrapCollection<any>(),
			catchError((err) => {
				console.error("Error loading reports:", err);
				throw err;
			}),
		);
	}

	downloadReport(reportId: number | string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/reports/${reportId}/download`, {
			responseType: "blob",
		});
	}

	generateReport(filter: {
		category: string;
		dateRange: string;
	}): Observable<Blob> {
		return this.http.post(`${this.apiUrl}/reports/generate`, filter, {
			responseType: "blob",
		});
	}

	getRevenue(startDate: string, endDate: string): Observable<any> {
		const params = new HttpParams()
			.set("start", startDate)
			.set("end", endDate);
		return this.http.get(`${this.apiUrl}/revenue`, { params });
	}

	createWithdrawal(withdrawal: {
		amount: number;
		paymentMethod: string;
		notes?: string;
	}): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/partner/withdrawals`, withdrawal)
			.pipe(
				tap((newRetrait: any) => {
					const item: Retrait = {
						id:
							newRetrait?.id ??
							`W00${this.retraits().length + 1}`,
						reference:
							newRetrait?.reference ??
							`RET-${Date.now().toString().slice(-4)}`,
						montant: newRetrait?.amount ?? withdrawal.amount,
						demandeur:
							newRetrait?.demandeur ??
							newRetrait?.requester ??
							"Utilisateur",
						dateDemande:
							newRetrait?.dateDemande ??
							new Date().toISOString().slice(0, 10),
						statut:
							newRetrait?.statut ??
							newRetrait?.status ??
							"en_attente",
					};
					this.retraits.update((list) => [item, ...list]);
				}),
				catchError((err) => {
					console.error("Error creating withdrawal:", err);
					throw err;
				}),
			);
	}

	cancelWithdrawal(withdrawalId: number | string): Observable<any> {
		return this.http
			.patch(
				`${this.apiUrl}/partner/withdrawals/${withdrawalId}/cancel`,
				{},
			)
			.pipe(
				tap((cancelled) => {
					this.retraits.update((list) =>
						list.map((w) =>
							String(w.id) === String(withdrawalId)
								? { ...w, statut: "annule", status: "annule" }
								: w,
						),
					);
				}),
				catchError((err) => {
					console.error("Error cancelling withdrawal:", err);
					throw err;
				}),
			);
	}

	getWithdrawals(): Observable<any[]> {
		return this.http.get<any>(`${this.apiUrl}/partner/withdrawals`).pipe(
			unwrapCollection<any>(),
			tap((w) => {
				this.retraits.set(w ?? []);
			}),
			catchError(() => of(this.retraits())),
		);
	}

	getWithdrawal(withdrawalId: number | string): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/partner/withdrawals/${withdrawalId}`)
			.pipe(
				catchError((err) => {
					console.error("Error loading withdrawal details:", err);
					const found = this.retraits().find(
						(r) => String(r.id) === String(withdrawalId),
					);
					if (found) {
						return of(found);
					}
					throw err;
				}),
			);
	}

	getTransactionStats(): Observable<any> {
		return this.http.get(`${this.apiUrl}/partner/transactions/stats`).pipe(
			catchError(() =>
				of({
					totalRevenue: 0,
					totalWithdrawals: 0,
					soldeDisponible: 0,
				}),
			),
		);
	}

	generateTripReport(tripId: number | string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/trips/${tripId}/report`, {
			responseType: "blob",
		});
	}

	getPaymentReceipt(paymentId: number | string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/payments/${paymentId}/receipt`, {
			responseType: "blob",
		});
	}

	getReservationReceipt(reservationId: number | string): Observable<Blob> {
		return this.http.get(
			`${this.apiUrl}/bookings/${reservationId}/receipt`,
			{
				responseType: "blob",
			},
		);
	}

	// ============= HELPER & SELECT METHODS =============

	getUnreadNotificationCount(): Observable<number> {
		return this.http
			.get<{
				count: number;
			}>(`${this.apiUrl}/user-notifications/unread/count`)
			.pipe(
				map((r) => r.count ?? 0),
				catchError(() =>
					of(this.notifications().filter((n) => !n.lu).length),
				),
			);
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
			.get<any>(`${this.apiUrl}/trips`, {
				params: new HttpParams().set("trip_date", today),
			})
			.pipe(
				unwrapCollection<Trip>(),
				catchError(() => of(this.trajets() as Trip[])),
			);
	}

	searchTrips(
		departure: string,
		arrival: string,
		date: string,
	): Observable<Trip[]> {
		const params = new HttpParams()
			.set("departure_city", departure)
			.set("arrival_city", arrival)
			.set("trip_date", date);
		return this.http.get<any>(`${this.apiUrl}/trips`, { params }).pipe(
			unwrapCollection<Trip>(),
			catchError(() => of(this.trajets() as Trip[])),
		);
	}

	getCities(): Observable<string[]> {
		return this.http
			.get<any>(`${this.apiUrl}/trips/cities/departure`)
			.pipe(unwrapCollection<string>());
	}

	getRecentBookings(): Observable<any[]> {
		return this.http.get<any>(`${this.apiUrl}/agency/recent-bookings`).pipe(
			unwrapCollection<any>(),
			tap((bookings) => this.setReservationsFromBookings(bookings)),
		);
	}

	getStaffMembers(agencyId?: number | string): Observable<any[]> {
		const params = agencyId
			? new HttpParams().set("agency_id", String(agencyId))
			: undefined;
		return this.http
			.get<any>(`${this.apiUrl}/users/staff`, { params })
			.pipe(
				unwrapCollection<any>(),
				tap((st) => {
					this.staff.set(st ?? []);
				}),
				catchError((err) => {
					console.error("Error loading staff members:", err);
					throw err;
				}),
			);
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
		return this.http.post<any>(`${this.apiUrl}/users/staff`, payload).pipe(
			tap((newUser) => {
				const u: Utilisateur = {
					id: newUser.id,
					nom: newUser.fullName || payload.fullName,
					email: newUser.email || payload.email || "",
					telephone: newUser.phoneNumber || payload.phoneNumber,
					role: (newUser.agent?.agentRole ||
						payload.agent?.agentRole ||
						"agent") as any,
					statut:
						newUser.status ||
						newUser.statut ||
						payload.agent?.status ||
						"actif",
					avatar:
						newUser.profilePhotoUrl ||
						payload.fullName.slice(0, 2).toUpperCase(),
					dateCreation: newUser.createdAt || newUser.dateCreation,
				};
				this.staff.update((list) => [u, ...list]);
			}),
		);
	}

  loadRevenueChart(period: '7j' | '30j' | '12m' = '30j'): Observable<RevenueChartResponse> {
    const endDate = new Date();
    const startDate = new Date();

    // Calcul dynamique de la date de début selon la période sélectionnée
    switch (period) {
      case '7j':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30j':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '12m':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Formatage YYYY-MM-DD
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const params = new HttpParams()
      .set('start', startStr)
      .set('end', endStr);

    // Note : Ajuste l'URL si "apiUrl" contient déjà "/api"
    return this.http.get<RevenueChartResponse>(`${this.apiUrl}/revenue`, { params }).pipe(
      tap((data) => {
        this.revenueChart.set(data);
      }),
      catchError((err : any) => {
        console.error('Erreur lors du chargement des données de revenu :', err);
        return throwError(() => err);
      })
    );
  }

	revenusChart(period: "7j" | "30j" | "12m"): {
		labels: string[];
		data: number[];
	} {
		// Keep for backward compatibility - loads data if not already loaded
		if (this.revenueChart().labels.length === 0) {
			this.loadRevenueChart(period).subscribe();
		}
		return this.revenueChart();
	}

	getBusTypes(): Observable<SelectOption[]> {
		return this.http.get<SelectOption[]>(`${this.apiUrl}/buses/types`).pipe(
			catchError((err) => {
				console.error("Error loading bus types:", err);
				throw err;
			}),
		);
	}

	getPointTypes(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/bus-points/types`)
			.pipe(
				catchError((err) => {
					console.error("Error loading point types:", err);
					throw err;
				}),
			);
	}

	getPaymentMethods(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/payment-methods`)
			.pipe(
				catchError((err) => {
					console.error("Error loading payment methods:", err);
					throw err;
				}),
			);
	}

	getStatusOptions(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/status-options`)
			.pipe(
				catchError((err) => {
					console.error("Error loading status options:", err);
					throw err;
				}),
			);
	}

	getAgencyPointStatusOptions(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/agency-points/status-options`)
			.pipe(
				catchError((err) => {
					console.error(
						"Error loading agency point status options:",
						err,
					);
					throw err;
				}),
			);
	}

	getRoleOptions(): Observable<SelectOption[]> {
		return this.http.get<SelectOption[]>(`${this.apiUrl}/users/roles`).pipe(
			catchError((err) => {
				console.error("Error loading role options:", err);
				throw err;
			}),
		);
	}

	getAgencies(): Observable<any[]> {
		return this.http
			.get<any>(`${this.apiUrl}/agencies`)
			.pipe(unwrapCollection<any>());
	}

	getTripStatusOptions(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/trips/status-options`)
			.pipe(
				catchError((err) => {
					console.error("Error loading trip status options:", err);
					throw err;
				}),
			);
	}

	getLanguageOptions(): Observable<SelectOption[]> {
		return this.http.get<SelectOption[]>(`${this.apiUrl}/languages`).pipe(
			catchError((err) => {
				console.error("Error loading language options:", err);
				throw err;
			}),
		);
	}

	getThemeOptions(): Observable<SelectOption[]> {
		return this.http.get<SelectOption[]>(`${this.apiUrl}/themes`).pipe(
			catchError((err) => {
				console.error("Error loading theme options:", err);
				throw err;
			}),
		);
	}

	getDateRangeOptions(): Observable<SelectOption[]> {
		// Ces valeurs sont des options d'interface, pas des ressources métier.
		// Elles n'ont donc pas besoin d'un endpoint HTTP dédié.
		return of<SelectOption[]>([
			{ value: "7j", label: "7 derniers jours" },
			{ value: "30j", label: "30 derniers jours" },
			{ value: "12m", label: "12 derniers mois" },
		]);
	}

	getReportCategoryOptions(): Observable<SelectOption[]> {
		return of<SelectOption[]>([
			{ value: "performance", label: "Performance" },
			{ value: "finance", label: "Finance" },
			{ value: "trips", label: "Trajets" },
		]);
	}

	getTransactionTypeOptions(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/transaction-types`)
			.pipe(
				catchError((err) => {
					console.error(
						"Error loading transaction type options:",
						err,
					);
					throw err;
				}),
			);
	}

	getManifestStatusOptions(): Observable<SelectOption[]> {
		return this.http
			.get<SelectOption[]>(`${this.apiUrl}/manifests/status-options`)
			.pipe(
				catchError((err) => {
					console.error(
						"Error loading manifest status options:",
						err,
					);
					throw err;
				}),
			);
	}

	getUserDetails(userId: number | string): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/users/staff/${userId}`).pipe(
			catchError((err) => {
				console.error("Error fetching user details:", err);
				throw err;
			}),
		);
	}

	updateUser(userId: number | string, payload: any): Observable<any> {
		return this.http
			.put<any>(`${this.apiUrl}/users/staff/${userId}`, payload)
			.pipe(
				tap((updatedUser) => {
					this.staff.update((list) =>
						list.map((u) =>
							String(u.id) === String(userId)
								? { ...u, ...updatedUser }
								: u,
						),
					);
				}),
				catchError((err) => {
					console.error("Error updating user:", err);
					throw err;
				}),
			);
	}

	deleteUser(userId: number | string): Observable<any> {
		return this.http
			.delete<any>(`${this.apiUrl}/users/staff/${userId}`)
			.pipe(
				tap(() => {
					this.staff.update((list) =>
						list.filter((u) => String(u.id) !== String(userId)),
					);
				}),
				catchError((err) => {
					console.error("Error deleting user:", err);
					throw err;
				}),
			);
	}
}
