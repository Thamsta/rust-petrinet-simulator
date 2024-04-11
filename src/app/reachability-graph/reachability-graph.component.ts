import {AfterViewInit, Component, Input} from '@angular/core';
import {graphviz} from "d3-graphviz";
import {v4 as uuidv4} from "uuid";
import {BaseToolbarComponent} from "../base-toolbar/base-toolbar.component";
import {WindowManagerComponent} from "../window-manager/window-manager.component";

/**
 * A canvas capable of displaying a reachability graph.
 * Needs an input graph in .dot format.
 */
@Component({
  selector: 'app-reachability-graph',
  templateUrl: './reachability-graph.component.html',
  styleUrls: ['./reachability-graph.component.scss']
})
export class ReachabilityGraphComponent implements AfterViewInit {
    @Input() windowManager!: WindowManagerComponent

    id = "rg-" + uuidv4()

    @Input()
    graph: string | undefined

    ngAfterViewInit() {
        if (this.graph == undefined) return

        graphviz(`#${this.id}`)
            .width(window.innerWidth)
            .height(window.innerHeight - 52 - BaseToolbarComponent.height) // leave 50 px for the tab bar
            .renderDot(this.graph)
    }

    getSVGContent() {
        return document.getElementById(this.id)!.outerHTML
    }
}
