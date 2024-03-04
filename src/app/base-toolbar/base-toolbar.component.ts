import {Component, Input} from '@angular/core';
import {NetCanvas} from "../canvas/canvas.component";
import {WindowManagerComponent} from "../window-manager/window-manager.component";

@Component({
  selector: 'app-base-toolbar',
  templateUrl: './base-toolbar.component.html',
  styleUrls: ['./base-toolbar.component.scss']
})
export class BaseToolbarComponent {
    static height = 65

    @Input() canvas: NetCanvas | undefined; // for exporting the net
    @Input() windowManager!: WindowManagerComponent

    openNewNet() {
        this.windowManager.openNewNet(undefined)
    }
}
