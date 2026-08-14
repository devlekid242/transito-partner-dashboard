import {
  Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ColumnDef, ActionDef } from '../../models';

@Component({
  selector: 'app-datatable',
  templateUrl: 'datatable.component.html' ,
  standalone: true,
  imports: [FormsModule, IconComponent, StatusBadgeComponent],
})
export class DatatableComponent implements OnInit, OnChanges {
  @Input({ required: true }) columns: ColumnDef[] = [];
  @Input() data: any[] = [];
  @Input() idKey = 'id';
  @Input() selectable = false;
  @Input() exportable = false;
  @Input() filterKey = 'statut';
  @Input() pageSizeDefault = 10;
  @Input() rowActions: ActionDef[] = [];

  @Output() selectionChange = new EventEmitter<any[]>();

  search = signal('');
  sortKey = signal<string>('');
  sortDir = signal<'asc' | 'desc'>('asc');
  page = signal(1);
  pageSize = signal(10);
  activeFilter = signal('');
  selected = signal<Set<string>>(new Set());

  cols = signal<ColumnDef[]>([]);
  filterOptions = signal<string[]>([]);

  ngOnInit() {
    this.pageSize.set(this.pageSizeDefault);
    this.cols.set(this.columns ?? []);
    this.computeFilters();
  }

  ngOnChanges() {
    if (this.columns?.length) this.cols.set(this.columns);
    this.computeFilters();
  }

  private computeFilters() {
    if (!this.data?.length || !this.filterKey) {
      this.filterOptions.set([]);
      return;
    }
    const set = new Set<string>();
    this.data.forEach((r) => {
      const v = r[this.filterKey];
      if (v) set.add(String(v));
    });
    this.filterOptions.set([...set].sort());
  }

  filtered = computed(() => {
    let rows = [...(this.data ?? [])];
    const q = this.search().trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        this.cols().some((c) =>
          String(r[c.key] ?? '').toLowerCase().includes(q),
        ),
      );
    }
    const f = this.activeFilter();
    if (f) {
      rows = rows.filter((r) => String(r[this.filterKey]) === f);
    }
    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
      });
    }
    return rows;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  startIdx = computed(() => (this.page() - 1) * this.pageSize());
  endIdx = computed(() => Math.min(this.startIdx() + this.pageSize(), this.filtered().length));
  paged = computed(() => this.filtered().slice(this.startIdx(), this.endIdx()));

  totalCols = computed(() =>
    this.cols().length + (this.selectable ? 1 : 0) + (this.rowActions.length ? 1 : 0),
  );

  allSelected = computed(() => {
    const ids = this.paged().map((r) => r[this.idKey]);
    return ids.length > 0 && ids.every((id: string) => this.selected().has(id));
  });
  someSelected = computed(() => {
    const ids = this.paged().map((r) => r[this.idKey]);
    const count = ids.filter((id: string) => this.selected().has(id)).length;
    return count > 0 && count < ids.length;
  });

  sort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  toggleAll(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const next = new Set(this.selected());
    this.paged().forEach((r) => {
      const id = r[this.idKey];
      if (checked) next.add(id); else next.delete(id);
    });
    this.selected.set(next);
    this.emitSelection();
  }
  toggleRow(row: any, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const next = new Set(this.selected());
    const id = row[this.idKey];
    if (checked) next.add(id); else next.delete(id);
    this.selected.set(next);
    this.emitSelection();
  }
  private emitSelection() {
    const sel = this.data.filter((r) => this.selected().has(r[this.idKey]));
    this.selectionChange.emit(sel);
  }

  exportCsv() {
    const cols = this.cols();
    const header = cols.map((c) => c.label).join(';');
    const lines = this.filtered().map((r) =>
      cols.map((c) => {
        const v = r[c.key];
        if (c.type === 'currency') return v;
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      }).join(';'),
    );
    const csv = '\uFEFF' + [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  formatCurrency(v: any): string {
    const n = Number(v) || 0;
    return n.toLocaleString('fr-FR') + ' FCFA';
  }
  formatDate(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    return d.toLocaleDateString('fr-FR');
  }
}
