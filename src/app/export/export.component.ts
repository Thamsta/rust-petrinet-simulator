import {Component, Input} from '@angular/core';
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";
import {Arc, Place, Transition} from "../elements";
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../dtos";
import {PnmlExporterService} from "../pnml/pnml-exporter.service";
import {ReachabilityGraphComponent} from "../reachability-graph/reachability-graph.component";
import {path} from "@tauri-apps/api";
import {NetCanvas} from "../canvas/shared/canvas.model";

/**
 * This component is responsible for exporting the content that is currently visible into a file.
 * Opens a save file dialog and supports different file extensions.
 * Comes with a button and shortcut.
 */
@Component({
    selector: 'app-export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.scss']
})
export class ExportComponent {

    @Input() canvas: NetCanvas | undefined; // for exporting the net
    @Input() rg: ReachabilityGraphComponent | undefined;

    async exportFile() {
        if (this.canvas) {
            await this.exportNet(this.canvas!)
            return
        }
        if (this.rg) {
            await this.exportRG(this.rg!)
            return
        }
    }

    private async exportNet(netCanvas: NetCanvas) {
        let [filePath, fileEnding] = await this.getFilePath("Save Net", ["pnon", "pnml"], "pnon")
        if (filePath.length == 0) return;

        const fileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1, filePath.lastIndexOf('.'))

        const net = createNetDTO(netCanvas, fileName)

        let output
        switch (fileEnding) {
            case 'pnon':
                output = JSON.stringify(net);
                break
            case 'pnml':
                output = new PnmlExporterService().createXml(net);
                break
        }

        if (!output) {
            // this case should be prevented by the OS file dialogue
            console.log(`Unsupported file type ${fileEnding} in path ${filePath}. Nothing will be written.`)
            return
        }

        await writeTextFile(filePath, output);

        netCanvas.onSavedNet(fileName)
    }

    private async exportRG(rgComponent: ReachabilityGraphComponent) {
        let [filePath, fileEnding] = await this.getFilePath("Save Reachability Graph", ["svg", "dot"], "svg")
        if (filePath.length == 0) return;

        let output
        switch (fileEnding) {
            case "svg":
                output = rgComponent.getSVGContent();
                break;
            case "dot":
                output = rgComponent.graph!;
                break;
        }

        if (!output) {
            // this case should be prevented by the OS file dialogue
            console.log(`Unsupported file type ${fileEnding} in path ${filePath}. Nothing will be written.`)
            return
        }

        await writeTextFile(filePath, output);
    }

    private async getFilePath(title: string, extensions: string[], defaultEnding: string): Promise<[string, string]> {
        let filePath = await save({
            title: title,
            filters: [{name: "", extensions: extensions}],
        });
        if (filePath == null) return ["", ""];

        if (!filePath.includes('.')) {
            filePath += "." + defaultEnding
        }

        const fileEnding = filePath.substring(filePath.lastIndexOf('.') + 1);

        if (fileEnding ! in extensions) {
            // don't allow custom extensions.
            return ["", ""];
        }

        return [filePath, fileEnding]
    }
}

export function createNetDTO(canvas: NetCanvas, name: string): NetDTO {
    const netElements = canvas.getAllElements()

    const places = netElements.filter(obj => obj instanceof Place)
        .map(t => PlaceDTO.fromPlace(t as Place))
    const transitions = netElements.filter(obj => obj instanceof Transition)
        .map(t => TransitionDTO.fromTransition(t as Transition))
    const arcs = netElements.filter(obj => obj instanceof Arc)
        .map(t => ArcDTO.fromArc(t as Arc))

    return new NetDTO(canvas.id, "pt-net", name, places, transitions, arcs)
}
