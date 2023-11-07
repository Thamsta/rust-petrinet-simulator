import {AfterContentInit, Component} from '@angular/core';
import {fabric} from 'fabric';

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit {
	canvas: fabric.Canvas = new fabric.Canvas('canvas');
	activeObject?: fabric.Object | undefined;
	color: any;

	constructor() {
	}

	ngAfterContentInit() {
		this.canvas = new fabric.Canvas('canvas');
		this.setupCanvas()
		window.addEventListener('resize', this.onWindowResize);
	}

	setupCanvas = () => {
		this.canvas.setDimensions({
			width: window.innerWidth * 0.7,
			height: window.innerHeight
		});
		this.canvas.setBackgroundColor('#565656', this.canvas.renderAll.bind(this.canvas));

		// extra canvas settings
		this.canvas.preserveObjectStacking = true;
		this.canvas.stopContextMenu = true;
		this.addRect()
	}

	addRect = () => {
		this.canvas.add(new fabric.Rect({
			left: this.canvas.width!! / 2,
			top: this.canvas.height!! / 2,
			fill: '#ffa726',
			width: 100,
			height: 100,
			originX: 'center',
			originY: 'center',
			strokeWidth: 0
		}));
	}

	onWindowResize = () => {
		this.canvas.setDimensions({
			width: window.innerWidth * 0.7,
			height: window.innerHeight
		});
	}
}
