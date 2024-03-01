import {AfterViewInit, Component, Input} from '@angular/core';
import {graphviz} from "d3-graphviz";

@Component({
  selector: 'app-reachability-graph',
  templateUrl: './reachability-graph.component.html',
  styleUrls: ['./reachability-graph.component.scss']
})
export class ReachabilityGraphComponent implements AfterViewInit {

    @Input()
    graph: string | undefined

    ngAfterViewInit() {
        if (this.graph == undefined) return

        graphviz('#rg')
            .width(window.innerWidth)
            .height(window.innerHeight - 50) // leave 50 px for the tab bar
            .renderDot(this.graph)
    }
}
