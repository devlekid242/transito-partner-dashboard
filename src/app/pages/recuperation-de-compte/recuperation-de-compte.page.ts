import { Component } from '@angular/core';

@Component({
  selector: 'app-recuperation-de-compte',
  templateUrl: './recuperation-de-compte.page.html',
  styleUrls: ['./recuperation-de-compte.page.css']
})
export class RecuperationDeComptePage {
  isLoading: boolean = false;
  isSent: boolean = false;

  constructor() {}

  // Gestion de la soumission du formulaire
  onSubmit(event: Event): void {
    event.preventDefault(); // Empêche le rafraîchissement natif de la page

    this.isLoading = true;

    // Simulation de l'envoi (1.5 seconde)
    setTimeout(() => {
      this.isLoading = false;
      this.isSent = true;

      // Réinitialisation de l'état du bouton après 3 secondes
      setTimeout(() => {
        this.isSent = false;
      }, 3000);
    }, 1500);
  }
}