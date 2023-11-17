import {Component} from '@angular/core';
import {RGResponse} from "../models";

@Component({
  selector: 'app-infobar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.scss']
})
export class InfoBarComponent {
    states: string = "0";
    edges: string = "0";

    isReversible: boolean = false

    public updateRGInfos(infos: RGResponse) {
        console.log("updating with", infos)
        this.states = this.formatNumber(infos.states)
        this.edges = this.formatNumber(infos.edges)
    }

    private formatNumber(num: number): string {
        // Use scientific notation for numbers larger than 10,000,000
        if (Math.abs(num) >= 1e7) {
            return num.toExponential(1);
        }

        // Format the number with spaces every three digits
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}