import { Component, Input, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  LayoutDashboard, Bus, MapPin, Route, CalendarClock, Wallet, Users,
  UserPlus, UserCircle, Building2, Bell, BarChart3, LogOut, Search,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsLeft,
  ChevronsRight, Plus, Pencil, Trash2, Eye, Download, Check, CheckCheck,
  AlertTriangle, Info, CheckCircle2, XCircle, Clock, ArrowUpRight,
  ArrowDownRight, Filter, Mail, Lock, Phone, MapPinned, Calendar, Ticket,
  FileText, Settings, ShieldCheck, TrendingUp, Banknote, CircleUser, Save,
  ArrowLeft, MoreVertical, Star, Bus as BusIcon,
} from 'lucide-angular';

const REGISTRY: Record<string, any> = {
  dashboard: LayoutDashboard, bus: Bus, 'map-pin': MapPin, route: Route,
  'calendar-clock': CalendarClock, wallet: Wallet, users: Users,
  'user-plus': UserPlus, 'user-circle': UserCircle, building: Building2,
  bell: Bell, 'bar-chart': BarChart3, logout: LogOut, search: Search,
  menu: Menu, x: X, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp,
  'chevrons-left': ChevronsLeft, 'chevrons-right': ChevronsRight, plus: Plus,
  pencil: Pencil, trash: Trash2, eye: Eye, download: Download, check: Check,
  'check-check': CheckCheck, 'alert-triangle': AlertTriangle, info: Info,
  'check-circle': CheckCircle2, 'x-circle': XCircle, clock: Clock,
  'arrow-up-right': ArrowUpRight, 'arrow-down-right': ArrowDownRight,
  filter: Filter, mail: Mail, lock: Lock, phone: Phone,
  'map-pinned': MapPinned, calendar: Calendar, ticket: Ticket, file: FileText,
  settings: Settings, 'shield-check': ShieldCheck, 'trending-up': TrendingUp,
  banknote: Banknote, 'circle-user': CircleUser, save: Save,
  'arrow-left': ArrowLeft, 'more-vertical': MoreVertical, star: Star,
  'bus-front': BusIcon,
};

export type IconName = keyof typeof REGISTRY;

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <lucide-angular [img]="cmp()" [size]="size" [strokeWidth]="strokeWidth" />
  `,
})
export class IconComponent {
  private _name = signal<string>('info');
  private _size = signal<number>(20);
  private _stroke = signal<number>(2);

  @Input({ required: true }) set name(v: IconName) { this._name.set(v); }
  @Input() set size(v: number | string) { if (v !== undefined && v !== null) this._size.set(+v); }
  @Input() set strokeWidth(v: number | string) { if (v !== undefined && v !== null) this._stroke.set(+v); }

  cmp = computed(() => REGISTRY[this._name()] ?? Info);
  get size() { return this._size(); }
  get strokeWidth() { return this._stroke(); }
}
