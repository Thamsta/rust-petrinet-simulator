import {Component, EventEmitter, Output} from '@angular/core';

export type ColorSelectEvent = {
    color: string
}

@Component({
    selector: 'app-coloring',
    templateUrl: './coloring.component.html',
    styleUrls: ['./coloring.component.scss']
})
export class ColoringComponent {
    @Output()
    colorChangeEmitter: EventEmitter<ColorSelectEvent> = new EventEmitter<ColorSelectEvent>();

    isOpen = true;
    color = "#ffffff"

    selectColor(color: string) {
        this.color = color
        //this.canvas.getTransitions().forEach(t => t.setColor(color))
        this.colorChangeEmitter.emit({color})
    }
}
