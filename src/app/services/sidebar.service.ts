import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private readonly sidebarOpen = signal<boolean>(false);
  readonly sidebarOpenSignal = this.sidebarOpen.asReadonly();
  readonly sidebarOpen$ = toObservable(this.sidebarOpen);

  constructor() {}

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  isSidebarOpen(): boolean {
    return this.sidebarOpen();
  }
}
