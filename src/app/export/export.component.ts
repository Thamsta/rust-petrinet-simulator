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
            await this.exportNet()
            return
        }
        if (this.rg) {
            await this.exportRG()
            return
        }
    }

    async exportNet() {
        if (!this.canvas) return

        let filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["pnon", "pnml"]}],
        });

        if (filePath == null) return;
        if (!filePath.includes('.')) filePath += ".pnon"

        const fileEnding = filePath.substring(filePath.lastIndexOf('.') + 1)
        const fileName = filePath.substring(filePath.lastIndexOf(path.sep) + 1, filePath.lastIndexOf('.'))

        const net = createNetDTO(this.canvas, fileName)

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

        this.canvas.onSavedNet(fileName)
    }

    private async exportRG() {
        let svgContent = this.rg!.getSVGContent()

        let filePath = await save({
            title: "Save Net",
            filters: [{name: "rg", extensions: ["svg"]}],
        });
        if (filePath == null) return;


        await writeTextFile(filePath, svgContent);
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
