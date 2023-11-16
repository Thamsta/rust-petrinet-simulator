import { Component } from '@angular/core';
import {RGResponse} from "../models";

@Component({
  selector: 'app-infobar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.scss']
})
export class InfoBarComponent {
    states: number = 0;
    edges: number = 0;

    isReversible: boolean = false

    public updateRGInfos(infos: RGResponse) {
        console.log("updating with", infos)
        this.states = infos.states
        this.edges = infos.edges
    }
}
