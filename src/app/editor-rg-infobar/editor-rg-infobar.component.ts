import {Component} from '@angular/core';
import {RGResponse} from "../models";

export interface ResultEntry {
    key: string
    value: string
}

@Component({
    selector: 'app-editor-rg-infobar',
    templateUrl: './editor-rg-infobar.component.html',
    styleUrls: ['./editor-rg-infobar.component.scss']
})
export class EditorRgInfobarComponent {
    message: string = "";

    rgResult: ResultEntry[] | undefined = undefined;
    displayedColumns: string[] = ['key', 'value'];

    deleteInfos() {
        this.rgResult = undefined
        this.message = ""
    }

    updateRGInfos(infos: RGResponse) {
        console.log("updating with", infos)
        if (infos.bounded < 0) {
            this.updateOnUnbounded(infos)
            return
        }

        this.update(
            this.formatNumber(infos.states),
            this.formatNumber(infos.edges),
            String(infos.bounded),
            infos.liveness ? "✔️" : "❌",
            infos.reversible ? "✔️" : "❌",
            infos.message
        )
    }

    updateOnUnbounded(infos: RGResponse) {
        this.update("∞", "∞", "❌", "", "", infos.message ? infos.message : "net is unbounded")
    }

    private update(states: string, edges: string, bounded: string, live: string, reversible: string, message: string) {
        this.rgResult = []
        this.rgResult.push({key: "States", value: states})
        this.rgResult.push({key: "Edges", value: edges})
        this.rgResult.push({key: "k-Bounded", value: bounded})
        this.rgResult.push({key: "Liveness", value: live})
        this.rgResult.push({key: "Reversible", value: reversible})
        this.message = message
    }

    updateOnError(_: any) {
        this.rgResult = []
        this.message = "Error occurred during reachability graph generation."
    }

    private formatNumber(num: number): string {
        // Use scientific notation for numbers larger than 10,000,000
        if (Math.abs(num) >= 1e7) {
            return num.toExponential(1);
        }

        // Format the number with spaces every three digits
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}
