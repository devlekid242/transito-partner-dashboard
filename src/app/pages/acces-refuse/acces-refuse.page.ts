import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acces-refuse',
  templateUrl: './acces-refuse.page.html',
  styleUrls: ['./acces-refuse.page.css'],
  standalone: true,
})
export class AccesRefusePage {
  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/connexion']);
  }
}
