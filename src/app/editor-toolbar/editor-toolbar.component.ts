import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DrawingTools} from './types';
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
    editorLocked: boolean = false

    @Output()
    controlEmitter = new EventEmitter<DrawingTools>
    @Input() canvas!: NetCanvas; // for exporting the net
    @Input() windowManager!: WindowManagerComponent

    ctrlPressed = false
    // tools which should be kept in selection if conditions are met
    keepableTools = [DrawingTools.PLACE, DrawingTools.TRANSITION, DrawingTools.ARC]
    // tools with an alternate mode
    altTools = [DrawingTools.TOKEN_INC, DrawingTools.TOKEN_DEC]

    constructor() {
        window.addEventListener('keyup', (e) => {
            if (!e.ctrlKey) this.ctrlPressed = false
        });
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey) this.ctrlPressed = true
        });
    }

    select(selected: DrawingTools) {
        this.selected = selected;

        this.controlEmitter.emit(selected)
        if (selected == DrawingTools.STOP || selected == DrawingTools.RG) {
            this.reset()
        } else if (selected == DrawingTools.STEP) {
            this.selected = DrawingTools.PAUSE
        }
    }

    getCurrentTool() {
        return this.selected
    }

    usedTool() {
        if (this.ctrlPressed && this.keepableTools.includes(this.selected)) {
            return
        }

        this.reset()
    }

    lockEditor() {
        if (this.editorLocked) {
            console.log("Locked editor toolbar even though it is already locked.")
        }
        this.editorLocked = true;
    }

    unlockEditor() {
        if (!this.editorLocked) {
            console.log("Unlocked editor toolbar even though it is already unlocked.")
        }
        this.editorLocked = false;
    }

    reset() {
        this.selected = DrawingTools.SELECT
    }
}
