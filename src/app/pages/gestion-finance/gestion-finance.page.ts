import { Component } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-gestion-finance',
  templateUrl: './gestion-finance.page.html',
  styleUrls: ['./gestion-finance.page.css'],
    imports: [RevenueChartComponent]
})
export class GestionFinancePage {
  constructor() {}
}