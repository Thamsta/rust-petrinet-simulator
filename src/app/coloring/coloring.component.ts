import {Component} from '@angular/core';

@Component({
    selector: 'app-coloring',
    templateUrl: './coloring.component.html',
    styleUrls: ['./coloring.component.scss']
})
export class ColoringComponent {
    isOpen = true;
    color = "#ffffff"

    selectColor(color: string) {
        this.color = color
        console.log(color)
    }
}
