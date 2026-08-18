import { BusPoint, Trip, Notification } from './partner.model';
export * from './partner.model';
import { AgencyDocument } from './partner.model';

export interface AgencyReservationTicket {
	id: number;
	seatNumber: string | number;
	passengerName: string;
	passengerPhone: string;
	status: string;
}

export interface AgencyReservation {
	id: number;
	reference: string;
	passager: string;
	passengerPhone: string;
	passengerEmail: string;
	trajet: string;
	departureCity: string;
	arrivalCity: string;
	date: string; // date de départ, utilisée pour la colonne "Date" du tableau
	departureTime: string | null;
	boardingPoint: string;
	deboardingPoint: string;
	seatNumber: string;
	montant: number;
	statut: string; // 'Confirmé' | 'En attente' | 'Annulé' | 'Remboursé'
	tickets: AgencyReservationTicket[];
	createdAt: string;
}

export type StatutReservation =
  | 'paye'
  | 'confirme'
  | 'en_cours'
  | 'annule'
  | 'echoue'
  | 'en_attente';

export type StatutRetrait =
  | 'en_attente'
  | 'valide'
  | 'rejete'
  | 'paye'
  | 'pending'
  | 'paid'
  | 'completee'
  | 'annule';

export type StatutTrajet = 'planifie' | 'en_cours' | 'termine' | 'annule';

export type StatutKyc = 'verifie' | 'en_attente' | 'rejete';

export type RoleUtilisateur =
  | 'admin'
  | 'manager'
  | 'agent'
  | 'comptable'
  | 'conducteur';

export interface Utilisateur {
  id: string | number;
  nom: string;
  fullName?: string;
  email: string;
  telephone?: string;
  phoneNumber?: string;
  role: RoleUtilisateur | string;
  statut: 'actif' | 'inactif' | string;
  status?: string;
  avatar?: string;
  profilePhotoUrl?: string;
  dateCreation?: string;
  agentRole?: string;
  agent?: any;
}

export interface PointEmbarquement extends BusPoint {}

export interface Trajet extends Trip {}

export interface Reservation {
  id: string | number;
  reference: string;
  passager: string;
  trajet: string;
  date: string;
  montant: number;
  statut: StatutReservation;
}

export interface Retrait {
  id: string | number;
  reference: string;
  montant: number;
  demandeur: string;
  dateDemande: string;
  statut: StatutRetrait;
  status?: string;
}

export interface Transaction {
  id: string | number;
  reference: string;
  type: 'credit' | 'debit';
  montant: number;
  amount?: number;
  description: string;
  date: string;
  createdAt?: string;
  statut?: string;
  status?: string;
}

export interface NotificationItem extends Notification {}

export interface Agence {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  legalRepresentative?: string;
  registrationNumber?: string;
  logoUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  mapUrl?: string;
  description?: string;
  status?: string;
  ratingCache?: string;
  isVerified?: boolean;
  commissionRate?: string;
  createdAt?: string;
  documents?: AgencyDocument[];
  // Compatibilité avec quelques réponses historiques de l'API.
  nom?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  logo?: string;
  kycStatut?: StatutKyc;
}

export interface KpiData {
  revenusAujourdhui: number;
  trajetsActifs: number | null;
  passagersTotaux: number;
  revenusMois: number | null;
  tauxOccupation: number;
  revenueChange?: number;
  tripsChange?: number;
  passengersChange?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'currency' | 'status' | 'badge';
  width?: string;
}

export interface ActionDef {
  label: string;
  icon?: string;
  class?: 'primary' | 'secondary' | 'ghost' | 'danger';
  action: (row: any) => void;
  condition?: (row: any) => boolean;
}
