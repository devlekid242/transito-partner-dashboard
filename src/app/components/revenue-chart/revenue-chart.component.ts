import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
// CORRECTION : Import depuis 'chart.js/auto' pour enregistrer automatiquement les échelles et graphiques
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-revenue-chart',
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.css'],
  // Si votre application utilise le mode moderne, vous pouvez ajouter standalone: true ici
})
export class RevenueChartComponent implements AfterViewInit, OnDestroy {
  // Typage plus précis du ElementRef pour un élément Canvas
  @ViewChild('revenueChart') revenueChart!: ElementRef<HTMLCanvasElement>;

  // Stockage de l'instance pour pouvoir la détruire proprement
  private chart!: Chart;

  ngAfterViewInit(): void {
    this.createChart();
  }

  // OPTIMISATION : Nettoyage de l'instance du graphique à la destruction du composant
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  createChart(): void {
    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return; // Sécurité TypeScript pour s'assurer que le contexte est disponible

    // Gradient pour la zone de remplissage
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(56, 128, 255, 0.2)'); // Couleur principale avec opacité
    gradient.addColorStop(1, 'rgba(56, 128, 255, 0)');

    // Données d'exemple
    const labels = ['1er', '5', '10', '15', '20', '25', '30'];
    const dataPoints = [850000, 920000, 1100000, 1050000, 1200000, 1150000, 1250000];

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenus',
            data: dataPoints,
            borderColor: '#3880ff',
            backgroundColor: gradient,
            borderWidth: 2,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#3880ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4, // Courbes lisses
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
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
                let value = context.parsed.y;
                return new Intl.NumberFormat('fr-FR').format(value) + ' XAF';
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false, // Désactive les lignes verticales de la grille
            },
            border: {
              display: false, // Équivalent de drawBorder: false pour l'axe X
            },
            ticks: {
              font: { family: 'Inter', size: 12 },
              color: '#727786', // outline
            },
          },
          y: {
            grid: {
              color: '#E0E0E0', // border-subtle (les lignes horizontales)
            },
            border: {
              display: false, // Équivalent de drawBorder: false pour l'axe Y
              dash: [5, 5], // CORRECT : Remplace borderDash sous Chart.js v4
            },
            ticks: {
              font: { family: 'Courier Prime', size: 12 },
              color: '#727786', // outline
              callback: function (value: any) {
                return value / 1000 + 'K';
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
    };

    // Assignation à la propriété de classe
    this.chart = new Chart(ctx, config);
  }
}
