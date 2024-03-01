import {AfterViewInit, Component} from '@angular/core';
import {graphviz} from "d3-graphviz";

@Component({
  selector: 'app-reachability-graph',
  templateUrl: './reachability-graph.component.html',
  styleUrls: ['./reachability-graph.component.scss']
})
export class ReachabilityGraphComponent implements AfterViewInit {

    ngAfterViewInit() {
        graphviz('#rg')
            .width(window.innerWidth)
            .height(window.innerHeight)
            .renderDot("digraph {\n" +
                "    0 [ label = \"[2, 0, 0]\"]\n" +
                "    1 [ label = \"[1, 0, 1]\"]\n" +
                "    2 [ label = \"[1, 1, 0]\"]\n" +
                "    3 [ label = \"[0, 1, 1]\"]\n" +
                "    4 [ label = \"[0, 2, 0]\"]\n" +
                "    5 [ label = \"[0, 0, 2]\"]\n" +
                "    0 -> 1 [ label = \"0\"]\n" +
                "    0 -> 2 [ label = \"2\"]\n" +
                "    2 -> 3 [ label = \"0\"]\n" +
                "    2 -> 4 [ label = \"2\"]\n" +
                "    3 -> 4 [ label = \"1\"]\n" +
                "    1 -> 5 [ label = \"0\"]\n" +
                "    1 -> 2 [ label = \"1\"]\n" +
                "    1 -> 3 [ label = \"2\"]\n" +
                "    5 -> 3 [ label = \"1\"]\n" +
                "}\n");
    }
}
