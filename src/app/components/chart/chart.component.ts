import {
  Component, Input, AfterViewInit, ViewChild, ElementRef, OnDestroy, OnChanges,
} from '@angular/core';
import {
  Chart, ChartConfiguration, ChartType, registerables,
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="relative h-full w-full"><canvas #canvas></canvas></div>`,
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) data!: ChartConfiguration['data'];
  @Input() options: ChartConfiguration['options'] = {};
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit() {
    this.render();
  }
  ngOnChanges() {
    if (this.chart) this.render();
  }
  private render() {
    if (!this.canvas) return;
    this.chart?.destroy();
    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...this.options,
      },
    });
  }
  ngOnDestroy() {
    this.chart?.destroy();
  }
}
