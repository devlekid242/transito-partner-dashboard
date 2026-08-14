import { Component, Input, Output, EventEmitter, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-modal",
    imports: [CommonModule],
    templateUrl: "modal.component.html",
    standalone: true,
})
export class ModalComponent {
    @Input({ alias: "title", required: true }) titleText = "";
    @Input({ alias: "subtitle" }) subtitleText = "";
    // Accept short and full size names for compatibility
    @Input() size: "sm" | "md" | "lg" | "small" | "medium" | "large" = "md";
    @Input() isOpen = false;

    @Input({ alias: "open" })
    set open(value: boolean) {
        this.isOpen = value;
    }

    get open(): boolean {
        return this.isOpen;
    }

    @Output() close = new EventEmitter<void>();

    readonly closing = signal(false);

    sizeClass() {
        const s = String(this.size);
        if (s === "lg" || s === "large") return "sm:max-w-3xl";
        if (s === "sm" || s === "small") return "sm:max-w-md";
        return "sm:max-w-xl";
    }

    onClose() {
        this.close.emit();
    }
}
