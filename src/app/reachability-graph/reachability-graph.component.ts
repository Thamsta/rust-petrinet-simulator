import {AfterViewInit, Component, Input} from '@angular/core';
import {graphviz} from "d3-graphviz";
import {v4 as uuidv4} from "uuid";
import {BaseToolbarComponent} from "../base-toolbar/base-toolbar.component";
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";

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
            .height(window.innerHeight - 52 - BaseToolbarComponent.height) // leave 50 px for the tab bar
            .renderDot(this.graph)
    }

    async saveSvgAsFile() {
        let svgContent = document.getElementById(this.id)!.outerHTML

        let filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["svg"]}],
        });
        if (filePath == null) return;


        await writeTextFile(filePath, svgContent);
    }
}
