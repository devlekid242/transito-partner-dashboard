import { Component } from '@angular/core';
import { RevenueChartComponent } from '../.././components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  imports: [RevenueChartComponent]
})
export class DashboardPage {
  constructor() {}
}