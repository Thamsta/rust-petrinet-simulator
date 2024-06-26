import {Component, Input} from '@angular/core';
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {ReachabilityGraphComponent} from "../reachability-graph/reachability-graph.component";

/**
 * The toolbar of the reachability graph, containing the buttons and commands to control the reachability graph.
 */
@Component({
  selector: 'app-reachability-graph-toolbar',
  templateUrl: './reachability-graph-toolbar.component.html',
  styleUrls: ['./reachability-graph-toolbar.component.scss']
})
export class ReachabilityGraphToolbarComponent {
    @Input() windowManager!: WindowManagerComponent
    @Input() rg!: ReachabilityGraphComponent
}
