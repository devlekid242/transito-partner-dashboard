export interface AgencyDocument {
  id: number;
  name: string;
  fileUrl: string;
  type?: string;
  status?: string;
  expiryDate?: string;
  createdAt: string;
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
}

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
  agent?: {
    id: number;
    agentRole: string;
    status: string;
    agency?: AgencyProfile;
  };
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

export interface BusPoint {
  id: number;
  name: string;
  city: string;
  quartier?: string;
  address: string;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  pointType?: 'principal' | 'premium' | 'express' | 'crossborder';
  status: 'active' | 'inactive';
  isActive: boolean;
  hasVipLounge?: number;
  hasWifi?: number;
  hasAc?: number;
  hasParking?: number;
  createdAt?: string;
}

export interface Trip {
  id: number;
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
  seatsReserved: number;
  status: 'planifie' | 'embarquement' | 'en_route' | 'termine' | 'annule';
  createdAt: string;
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
  arrival: string;
  departureTime: string;
  arrivalTime?: string;
  status?: 'planifie' | 'embarquement' | 'en_route' | 'termine' | 'annule';
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
  boardingPoints?: Array<{ name: string; time: string; address?: string }>;
  deboardingPoints?: Array<{ name: string; time: string; address?: string }>;
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

export interface Passenger {
  id: number;
  seatNumber: string;
  name: string;
  phone: string;
  ticketCode: string;
  status: 'Embarqué' | 'Payé' | 'Annulé';
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
  payload?: any;
  createdAt: string;
  updatedAt?: string;
}
