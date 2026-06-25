import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-demande-de-retrait',
  templateUrl: './demande-de-retrait.page.html',
  styleUrls: ['./demande-de-retrait.page.css'],
  imports: [CommonModule]
})
export class DemandeDeRetraitPage {
  // Gestion de l'état de visibilité de la modale
  isModalOpen: boolean = false;

  constructor() {}

  // Ouvrir la modale
  openModal(): void {
    this.isModalOpen = true;
  }

  // Fermer la modale
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Traitement de la soumission du formulaire
  onSubmit(event: Event): void {
    event.preventDefault();
    // Intégrez votre logique d'API ici
    this.closeModal();
  }
}