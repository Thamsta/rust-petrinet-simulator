import {AfterViewInit, Component, Input} from '@angular/core';
import {graphviz} from "d3-graphviz";
import {v4 as uuidv4} from "uuid";

@Component({
  selector: 'app-reachability-graph',
  templateUrl: './reachability-graph.component.html',
  styleUrls: ['./reachability-graph.component.scss']
})
export class ReachabilityGraphComponent implements AfterViewInit {

    id = "rg-" + uuidv4()

    @Input()
    graph: string | undefined

    ngAfterViewInit() {
        if (this.graph == undefined) return

        graphviz(`#${this.id}`)
            .width(window.innerWidth)
            .height(window.innerHeight - 50) // leave 50 px for the tab bar
            .renderDot(this.graph)
    }
}
