import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DrawingTools} from '../models';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from "@angular/material/tooltip";
import {NetCanvas} from "../canvas/canvas.component";
import {WindowManagerComponent} from "../window-manager/window-manager.component";

export const tooltipDelays: MatTooltipDefaultOptions = {
    showDelay: 400,
    hideDelay: 100,
    touchendHideDelay: 1000,
};

@Component({
  selector: 'app-editor-toolbar',
  templateUrl: './editor-toolbar.component.html',
    providers: [{provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDelays}],
    styleUrls: ['./editor-toolbar.component.scss']
})
export class EditorToolbarComponent {
    protected readonly DrawingTools = DrawingTools;
    selected: DrawingTools = DrawingTools.SELECT;

    @Output()
    controlEmitter = new EventEmitter<DrawingTools>
    @Input() canvas!: NetCanvas; // for exporting the net
    @Input() windowManager!: WindowManagerComponent


    select(selected: DrawingTools) {
        this.selected = selected;

        this.controlEmitter.emit(selected)
        if (selected == DrawingTools.STOP || selected == DrawingTools.RG || selected == DrawingTools.GARBAGE
            || selected == DrawingTools.NAME || selected == DrawingTools.TOKEN_DEC || selected == DrawingTools.TOKEN_INC) {
            this.selected = DrawingTools.SELECT
        } else if (selected == DrawingTools.STEP) {
            this.selected = DrawingTools.PAUSE
        }
    }
}
