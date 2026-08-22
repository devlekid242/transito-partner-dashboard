import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.prod';

/**
 * Permet au partenaire (compte admin_agence) de contacter l'ADMINISTRATION
 * de la plateforme — litige de commission, souci technique, question sur un
 * retrait, etc. Sens différent de PartnerSupportService : ici, l'agence est
 * l'AUTEUR du ticket, pas le répondant.
 *
 * 👈 Pointe volontairement vers /api/support, le même endpoint que la page
 * "Contacter le support" de l'app client (SupportController côté back) :
 * un partenaire authentifié qui crée un ticket devient simplement le User
 * propriétaire de ce ticket, exactement comme un client. Pas besoin d'un
 * contrôleur dédié. PartnerSupportController (/api/partner/support) reste
 * réservé aux tickets DES CLIENTS de l'agence, jamais aux tickets DE
 * l'agence elle-même.
 */

export type SupportTicketStatus = 'open' | 'answered' | 'closed' | 'pending';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SupportResponse {
  id: number;
  message: string;
  createdAt: string;
  author?: { id: number; fullName: string; isCurrentUser?: boolean } | null;
}

export interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string | null;
  responseCount?: number;
  slaDueAt?: string | null;
  slaBreached?: boolean;
  agencyId?: number | null;
  responses?: SupportResponse[];
}

@Injectable({ providedIn: 'root' })
export class PartnerSupportService {
  private apiUrl = `${environment.apiUrl}/support`;

  readonly tickets = signal<SupportTicket[]>([]);
  readonly currentTicket = signal<SupportTicket | null>(null);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Crée un ticket adressé à l'administration. `agencyId` est optionnel :
   * le renseigner donne du contexte à l'admin (quelle agence écrit), mais
   * n'est pas obligatoire pour une question purement technique/compte.
   */
  createTicket(payload: {
    subject: string;
    message: string;
    category?: string;
    priority?: SupportTicketPriority;
    agencyId?: number;
  }): Observable<{ id: number } | null> {
    return this.http.post<{ id: number }>(this.apiUrl, payload).pipe(
      tap(() => this.getMyTickets().subscribe()),
      catchError((err) => {
        console.error("Erreur création ticket vers l'administration:", err);
        this.error.set("Impossible d'envoyer votre demande.");
        return of(null);
      }),
    );
  }

  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<{ data: SupportTicket[] }>(`${this.apiUrl}/my-tickets`).pipe(
      map((res) => res.data || []),
      tap((data) => this.tickets.set(data)),
      catchError((err) => {
        console.error('Erreur chargement de vos tickets:', err);
        this.error.set('Impossible de charger vos tickets.');
        return of([]);
      }),
    );
  }

  getTicketDetails(id: number): Observable<SupportTicket | null> {
    return this.http.get<SupportTicket>(`${this.apiUrl}/${id}`).pipe(
      tap((ticket) => this.currentTicket.set(ticket)),
      catchError((err) => {
        console.error('Erreur détail ticket:', err);
        return of(null);
      }),
    );
  }

  addResponse(id: number, message: string): Observable<{ id: number } | null> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/${id}/responses`, { message }).pipe(
      catchError((err) => {
        console.error('Erreur envoi réponse:', err);
        return of(null);
      }),
    );
  }

  closeTicket(id: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/close`, { reason });
  }

  reopenTicket(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reopen`, {});
  }

  clearError(): void {
    this.error.set(null);
  }
}
