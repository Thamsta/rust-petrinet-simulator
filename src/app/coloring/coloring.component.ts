import {Component, EventEmitter, Output} from '@angular/core';

export type ColorSelectEvent = {
    color: string
}

const COLORS: string[] = [
    "#ffffff", "#000000", "#ffa86b", "#ffcc84", "#ffe69e",
    "#ccd5ae", "#e9edc9", "#fefae0", "#faedcd", "#d4a373",
    "#ffd6ff", "#e7c6ff", "#c8b6ff", "#b8c0ff", "#bbd0ff",
]

@Component({
    selector: 'app-coloring',
    templateUrl: './coloring.component.html',
    styleUrls: ['./coloring.component.scss']
})
export class ColoringComponent {
    @Output()
    colorChangeEmitter: EventEmitter<ColorSelectEvent> = new EventEmitter<ColorSelectEvent>();

    isOpen = false;
    color = "#ffffff"

    selectColor(color: string) {
        this.color = color
        this.colorChangeEmitter.emit({color})
    }

    protected readonly COLORS = COLORS;
}
