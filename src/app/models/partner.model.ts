export interface AgencyDocument {
  id: number;
  name: string;
  fileUrl: string;
  type?: string;
  status?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface RevenueChartResponse {
  labels: string[];
  data: number[];
  totalRevenue: number;
}

export interface AgencyProfile {
  id: number;
  name?: string;
  registrationNumber?: string;
  logoUrl?: string;
  bannerUrl?: string;
  mapUrl?: string;
  websiteUrl?: string;
  address?: string;
  description?: string;
  phone?: string;
  email?: string;
  ratingCache?: string;
  status?: string;
  createdAt?: string;
  documents?: AgencyDocument[];
  	/** Numéro mobile money validé, utilisé pour les retraits. Absent tant que normalizeAgency() ne l'expose pas côté back. */
	payoutMsisdn?: string | null;
	/** Numéro proposé par l'agence, en attente de validation admin. */
	pendingPayoutMsisdn?: string | null;
	pendingPayoutMsisdnRequestedAt?: string | null;
}

export interface PartnerProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  permissions?: string[];
  prefNotifications: number;
  prefLanguage: string;
  prefDarkMode: number;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: number;
    agentRole: string;
    status: string;
    agency?: AgencyProfile;
  };
  // Backwards compatibility: some APIs return `agence` or `agency`
  agence?: AgencyProfile | any;
  // agency?: Agence | AgencyProfile | any;
}

export interface PartnerStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalRevenue: number;
  activeBuses: number;
  totalBuses: number;
  totalPassengers: number;
  cancellationRate: number;
}

export interface Bus {
  id: number | string;
  registrationNumber?: string;
  immatriculation?: string;
  capacity?: number;
  capacite?: number;
  category?: 'VIP' | 'Classique';
  status?: string;
  statut?: 'actif' | 'maintenance' | 'hors_service';
  brand?: string;
  model?: string;
  modele?: string;
  color?: string;
  acquisitionDate?: string;
  mileage?: number;
  lastMaintenanceDate?: string;
  createdAt?: string;
  dateAjout?: string;
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

export interface BusPoint {
  id: number | string;
  name?: string;
  nom?: string;
  city?: string;
  ville?: string;
  quartier?: string;
  address?: string;
  adresse?: string;
  heure?: string;
  embarkationTime?: string;
  time?: string;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  pointType?: 'principal' | 'premium' | 'express' | 'crossborder';
  status?: string;
  statut?: string;
  isActive?: number;
  hasVipLounge?: number;
  hasWifi?: number;
  hasAc?: number;
  hasParking?: number;
  createdAt?: string;
}

export interface Passenger {
  id: number;
  seatNumber: string | number;
  name: string;
  phone?: string;
  phoneNumber?: string;
  ticketCode: string;
  ticketNumber?: string;
  boardingStatus?: string;
  boardingPoint?: string;
  deboardingPoint?: string;
  price?: number;
  status?: 'Embarqué' | 'Payé' | 'Annulé';
}

export interface Trip {
  id: number | string;
  departureCity: string;
  arrivalCity: string;
  boardingPoints: Array<{ id: number; name: string; address?: string; city?: string }>;
  deboardingPoints: Array<{ id: number; name: string; address?: string; city?: string }>;
  departurePoint?: any;
  arrivalPoint?: any;
  departureTime: string;
  estimatedArrivalTime?: string;
  tripDate?: string;
  departureTimeOfDay?: string;
  arrivalTimeOfDay?: string;
  origine?: string;
  destination?: string;
  heureDepart?: string;
  dateDepart?: string;
  placesDisponibles?: number;
  placesTotal?: number;
  price: string | number;
  driverName?: string;
  driverLicense?: string;
  driverPhone?: string;
  driverExperience?: string;
  driverPhotoUrl?: string;

  hostessName?: string;
  hostessPhone?: string;
  hostessPhotoUrl?: string;
  passengers?: Passenger[];

  bus?: any;
  seatsReserved?: number;
  busId?: number | string;
  boardingPointIds?: Array<number | string>;
  deboardingPointIds?: Array<number | string>;
  departure?: string;
  arrival?: string;
  departureDate?: string;
  availableSeats?: number;
  maxSeats?: number;
  status?: string;
  statut?: string;
  createdAt?: string;
  time?: string;
  date?: string;
  route?: string;
  notes?: string;
}

export interface ManifestData {
  tripId: number;
  route: {
    departure: string;
    arrival: string;
    departurePoint?: string;
    arrivalPoint?: string;
    departureDateTime?: string;
    arrivalDateTime?: string;
  };
  departure: string;
  departureCity?: string;
  arrival: string;
  arrivalCity?: string;
  departureTime: string;
  arrivalTime?: string;
  busRegistrationNumber?: string;
  seatsReserved?: number;
  busCapacity?: number;
  totalRevenue?: number;
  status?: string;
  notes?: string;
  busInfo: {
    id: number;
    licensePlate: string;
    capacity: number;
    model: string;
    image?: string;
    photoUrl?: string;
  };
  driver?: {
    name: string;
    license?: string;
    phone?: string;
    experience?: string;
    photo?: string;
  };
  hostess?: {
    name: string;
    phone?: string;
    photo?: string;
  };
  passengers: Array<{
    id: number;
    name: string;
    seatNumber: number;
    ticketNumber: string;
    boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW' | 'CANCELLED';
    phoneNumber?: string;
    boardingPoint?: string;
    deboardingPoint?: string;
    price?: number;
  }>;
  boardingPoints?: Array<{ id?: number; name: string; time?: string; address?: string; city?: string }>;
  deboardingPoints?: Array<{ id?: number; name: string; time?: string; address?: string; city?: string }>;
  stops?: Array<{
    location: string;
    time: string;
    status: string;
    completed?: boolean;
    current?: boolean;
  }>;
  stats?: {
    total: number;
    boarded: number;
    pending: number;
    noShow: number;
    cancelled: number;
    occupancyRate: number;
  };
}

export interface Notification {
  id: number | string;
  recipientType?: string;
  recipientId?: number | null;
  type?: string;
  category?: string;
  title?: string;
  titre?: string;
  message?: string;
  time?: string;
  date?: string;
  isRead?: boolean;
  read?: boolean;
  lu?: boolean;
  payload?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketValidationResponse {
  success: boolean;
  ticketNumber: string;
  passengerName: string;
  boardingStatus: 'VALID' | 'ALREADY_BOARDED' | 'NOT_FOUND' | 'CANCELLED';
  message: string;
  boardingTime?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}
