import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {ReachabilityGraphComponent} from "../reachability-graph/reachability-graph.component";
import {NetCanvas} from "../canvas/shared/canvas.model";

@Component({
    selector: 'app-base-toolbar',
    templateUrl: './base-toolbar.component.html',
    styleUrls: ['./base-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseToolbarComponent {
    static height = 65

    @Input() canvas: NetCanvas | undefined; // for exporting the net
    @Input() rg: ReachabilityGraphComponent | undefined; // for exporting the rg
    @Input() windowManager!: WindowManagerComponent

    openNewNet() {
        this.windowManager.openNewNet(undefined)
    }
}
