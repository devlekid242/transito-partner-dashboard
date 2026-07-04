import { Component, OnInit, computed } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../services/sidebar.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, CommonModule],
})
export class LayoutComponent implements OnInit {
  readonly sidebarOpen = computed(() => this.sidebarService.sidebarOpenSignal());

  constructor(public sidebarService: SidebarService) {}

  ngOnInit(): void {
    // Fermer le sidebar au changement de route sur mobile
    // (optionnel, à ajouter si vous avez une gestion de route)
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  closeSidebar(): void {
    this.sidebarService.closeSidebar();
  }
}
