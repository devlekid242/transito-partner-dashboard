import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
// CORRECTION : Import depuis 'chart.js/auto' pour enregistrer automatiquement les échelles et graphiques
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-revenue-chart',
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.css'],
  imports: [CommonModule],
})
export class RevenueChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;

  private chart!: Chart;

  @Input() chartType: ChartType = 'bar';
  @Input() chartTitle = '';
  @Input() datasetLabel = 'Revenus';
  @Input() labels: string[] = ['1er', '5', '10', '15', '20', '25', '30'];
  @Input() dataPoints: number[] = [850000, 920000, 1100000, 1050000, 1200000, 1150000, 1250000];
  @Input() datasets: any[] = [];
  @Input() chartOptions: any = {};

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private mergeOptions(defaultOptions: any, customOptions: any) {
    return {
      ...defaultOptions,
      ...customOptions,
      plugins: {
        ...defaultOptions?.plugins,
        ...customOptions?.plugins,
      },
      scales: {
        ...defaultOptions?.scales,
        ...customOptions?.scales,
      },
    };
  }

  createChart(): void {
    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(56, 128, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(56, 128, 255, 0)');

    const labels = this.labels;
    const datasets =
      this.datasets.length > 0
        ? this.datasets
        : [
            {
              label: this.datasetLabel,
              data: this.dataPoints,
              borderColor: '#3880ff',
              backgroundColor: gradient,
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ];

    const config: ChartConfiguration = {
      type: this.chartType,
      data: {
        labels,
        datasets,
      },
      options: this.mergeOptions(
        {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!this.chartTitle,
              text: this.chartTitle,
              color: '#0f172a',
              font: { family: 'Inter', size: 14, weight: '600' as any },
            },
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: '#293138',
              titleFont: { family: 'Inter', size: 12 },
              bodyFont: { family: 'Courier Prime', size: 13 },
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function (context: any) {
                  const value = context.parsed.y ?? context.parsed ?? 0;
                  return new Intl.NumberFormat('fr-FR').format(value) + ' XAF';
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                font: { family: 'Inter', size: 12 },
                color: '#727786',
              },
            },
            y: {
              grid: {
                color: '#E0E0E0',
              },
              border: {
                display: false,
                dash: [5, 5],
              },
              ticks: {
                font: { family: 'Courier Prime', size: 12 },
                color: '#727786',
                callback: function (value: any) {
                  return String(value / 1000) + 'K';
                },
              },
              beginAtZero: true,
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
        this.chartOptions,
      ),
    };

    this.chart = new Chart(ctx, config);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.chart &&
      (changes['labels'] ||
        changes['dataPoints'] ||
        changes['datasets'] ||
        changes['chartType'] ||
        changes['chartOptions'] ||
        changes['chartTitle'])
    ) {
      this.chart.destroy();
      this.createChart();
    }
  }
}
