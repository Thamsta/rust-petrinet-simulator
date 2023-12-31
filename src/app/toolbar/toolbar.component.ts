import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DrawingTools, isPlayerCommand} from '../models';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from "@angular/material/tooltip";
import {CanvasComponent, NetCanvas} from "../canvas/canvas.component";

export const tooltipDelays: MatTooltipDefaultOptions = {
    showDelay: 400,
    hideDelay: 100,
    touchendHideDelay: 1000,
};

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    providers: [{provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDelays}],
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
    protected readonly DrawingTools = DrawingTools;
    selected: DrawingTools = DrawingTools.SELECT;

    @Output()
    controlEmitter = new EventEmitter<DrawingTools>
    @Input() canvas: NetCanvas | undefined; // for exporting the net


    select(selected: DrawingTools) {
        this.selected = selected;

        this.controlEmitter.emit(selected)
        if (selected == DrawingTools.STOP || selected == DrawingTools.RG) {
            this.selected = DrawingTools.SELECT
        } else if (selected == DrawingTools.STEP) {
            this.selected = DrawingTools.PAUSE
        }
    }
}
