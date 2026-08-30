import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
	PartnerSupportService,
	SupportTicket,
	SupportTicketPriority,
	SupportTicketStatus,
} from "../../services/partner-support.service";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

/**
 * Page "Contacter l'administration" du back-office partenaire : le
 * partenaire est ici l'auteur des tickets (pas le répondant), à destination
 * de l'équipe support de la plateforme. Ne pas confondre avec
 * PartnerSupportPage, qui gère les tickets DES CLIENTS de l'agence.
 */
@Component({
	selector: "app-partner-support",
	imports: [CommonModule, FormsModule, PageHeaderComponent],
	templateUrl: "partner-support.page.html",
})
export class PartnerSupportPage implements OnInit {
	readonly service = inject(PartnerSupportService);

	readonly selectedId = signal<number | null>(null);
	readonly selectedTicket = signal<SupportTicket | null>(null);
	readonly isLoadingThread = signal(false);
	readonly isSubmittingNew = signal(false);
	readonly isReplying = signal(false);
	readonly showNewTicketForm = signal(false);

	readonly categories = [
		{ value: "facturation", label: "Facturation / commission" },
		{ value: "technique", label: "Problème technique" },
		{ value: "compte", label: "Compte agence" },
		{ value: "autre", label: "Autre" },
	];

	newSubject = "";
	newMessage = "";
	newCategory = "autre";
	newPriority: SupportTicketPriority = "medium";

	ngOnInit(): void {
		this.service.getMyTickets().subscribe();
	}

	openNewTicketForm(): void {
		this.selectedId.set(null);
		this.selectedTicket.set(null);
		this.showNewTicketForm.set(true);
	}

	submitNewTicket(): void {
		if (!this.newSubject.trim() || !this.newMessage.trim()) return;

		this.isSubmittingNew.set(true);
		this.service
			.createTicket({
				subject: this.newSubject.trim(),
				message: this.newMessage.trim(),
				category: this.newCategory,
				priority: this.newPriority,
				// 👈 Donne du contexte à l'admin sur l'agence à l'origine de la
				// demande. Adapte `agencyId` si ton app expose l'agence courante
				// autrement (ex. via un AuthService.currentAgencyId()).
			})
			.subscribe({
				next: (res) => {
					this.isSubmittingNew.set(false);
					this.showNewTicketForm.set(false);
					this.newSubject = "";
					this.newMessage = "";
					this.newCategory = "autre";
					this.newPriority = "medium";
					if (res?.id) this.selectTicketById(res.id);
				},
				error: () => this.isSubmittingNew.set(false),
			});
	}

	cancelNewTicket(): void {
		this.showNewTicketForm.set(false);
	}

	selectTicketById(id: number): void {
		this.selectedId.set(id);
		this.showNewTicketForm.set(false);
		this.isLoadingThread.set(true);

		this.service.getTicketDetails(id).subscribe({
			next: (ticket) => {
				this.selectedTicket.set(ticket);
				this.isLoadingThread.set(false);
			},
			error: () => this.isLoadingThread.set(false),
		});
	}

	sendReply(text: string): void {
		const id = this.selectedId();
		if (!text.trim() || !id) return;

		this.isReplying.set(true);
		this.service.addResponse(id, text.trim()).subscribe({
			next: () => {
				this.isReplying.set(false);
				this.selectTicketById(id);
			},
			error: () => this.isReplying.set(false),
		});
	}

	closeTicket(): void {
		const id = this.selectedId();
		if (!id) return;
		this.service.closeTicket(id).subscribe(() => {
			this.selectTicketById(id);
			this.service.getMyTickets().subscribe();
		});
	}

	reopenTicket(): void {
		const id = this.selectedId();
		if (!id) return;
		this.service.reopenTicket(id).subscribe(() => {
			this.selectTicketById(id);
			this.service.getMyTickets().subscribe();
		});
	}

	getStatusLabel(status: SupportTicketStatus): string {
		switch (status) {
			case "open":
				return "Ouvert";
			case "answered":
				return "Répondu";
			case "closed":
				return "Fermé";
			case "pending":
				return "En attente";
			default:
				return "Inconnu";
		}
	}

	getStatusColor(status: SupportTicketStatus): string {
		switch (status) {
			case "open":
				return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
			case "answered":
				return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
			case "closed":
				return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
			case "pending":
				return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
			default:
				return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
		}
	}

	getPriorityLabel(priority?: SupportTicketPriority): string {
		switch (priority) {
			case "low":
				return "Faible";
			case "medium":
				return "Moyenne";
			case "high":
				return "Élevée";
			case "critical":
				return "Critique";
			default:
				return "Standard";
		}
	}

	getPriorityColor(priority?: SupportTicketPriority): string {
		switch (priority) {
			case "low":
				return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
			case "medium":
				return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
			case "high":
				return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
			case "critical":
				return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
			default:
				return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
		}
	}

	getCategoryLabel(category?: string): string {
		switch (category) {
			case "facturation":
				return "Facturation";
			case "technique":
				return "Technique";
			case "compte":
				return "Compte";
			case "autre":
				return "Autre";
			default:
				return category || "Autre";
		}
	}

	getCategoryColor(category?: string): string {
		switch (category) {
			case "facturation":
				return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
			case "technique":
				return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
			case "compte":
				return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
			default:
				return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
		}
	}
}