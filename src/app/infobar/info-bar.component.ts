import {Component} from '@angular/core';
import {RGResponse} from "../models";

@Component({
	selector: 'app-infobar',
	templateUrl: './info-bar.component.html',
	styleUrls: ['./info-bar.component.scss']
})
export class InfoBarComponent {
	states: string = "";
	edges: string = "";
	reversible: string = "";
	live: string = "";
	bounded: string = "";
	message: string = "";

	updateRGInfos(infos: RGResponse) {
		console.log("updating with", infos)
		if (infos.bounded < 0) {
			this.updateOnUnbounded(infos)
			return
		}
		this.states = this.formatNumber(infos.states)
		this.edges = this.formatNumber(infos.edges)
		this.reversible = String(infos.reversible)
		this.live = String(infos.liveness)
		this.bounded = String(infos.bounded)
		this.message = infos.message
	}

	updateOnUnbounded(infos: RGResponse) {
		this.states = "∞"
		this.edges = "∞"
		this.reversible = ""
		this.live = ""
		this.bounded = "false"
		this.message = infos.message ? infos.message : "net is unbounded"
	}

	updateOnError(_: any) {
		this.states = ""
		this.edges = ""
		this.reversible = ""
		this.live = ""
		this.message = ""
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
