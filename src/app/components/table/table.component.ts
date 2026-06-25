import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
}

export interface TableAction {
  icon: string;
  label: string;
  action: (item: any) => void;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  imports: [ CommonModule ]
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() pageSize: number = 10;
  @Output() sort = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();
  
  @ContentChild('customCell') customCellTemplate: TemplateRef<any> | undefined;

  currentPage: number = 1;
  sortKey: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  onSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.sort.emit({ key, direction: this.sortDirection });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onActionClick(action: TableAction, item: any): void {
    action.action(item);
  }

  // Méthode pour obtenir la valeur d'une cellule
  getCellValue(item: any, column: TableColumn): any {
    return item[column.key];
  }

}