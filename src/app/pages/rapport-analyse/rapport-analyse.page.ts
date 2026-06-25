import { Component } from '@angular/core';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-rapport-analyse',
  templateUrl: './rapport-analyse.page.html',
  styleUrls: ['./rapport-analyse.page.css'],
  imports: [RevenueChartComponent]
})
export class RapportAnalysePage {
  constructor() {}
}
