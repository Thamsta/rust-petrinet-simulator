import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {DrawingTools} from './editor-toolbar.models';
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {EditorTooltipsComponent} from "../editor-tooltips/editor-tooltips.component";
import {NetCanvas} from "../canvas/shared/canvas.model";
import {ColoringComponent} from "../coloring/coloring.component";

/**
 * The toolbar of the editor, containing the buttons and commands to control the editor.
 */
@Component({
  selector: 'app-editor-toolbar',
  templateUrl: './editor-toolbar.component.html',
    styleUrls: ['./editor-toolbar.component.scss']
})
export class EditorToolbarComponent {
    protected readonly DrawingTools = DrawingTools;
    selected: DrawingTools = DrawingTools.SELECT;
    editorLocked: boolean = false

    infoDialog: MatDialogRef<EditorTooltipsComponent> | undefined = undefined

    @Output()
    controlEmitter = new EventEmitter<DrawingTools>
    @Input() canvas!: NetCanvas; // for exporting the net
    @Input() windowManager!: WindowManagerComponent

    @ViewChild('color')
    colorPicker!: ColoringComponent

    ctrlPressed = false
    // tools which should be kept in selection if conditions are met
    keepableTools = [DrawingTools.PLACE, DrawingTools.TRANSITION, DrawingTools.ARC]

    constructor(private dialog: MatDialog) {
        window.addEventListener('keyup', (e) => {
            if (!e.ctrlKey) this.ctrlPressed = false
        });
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey) this.ctrlPressed = true
        });
    }

    select(selected: DrawingTools) {
        this.selected = selected

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

    getCurrentlySelectedColor() {
        return this.colorPicker.color
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

    toggleEditorTooltips() {
        if (this.infoDialog != undefined) {
            // it's already open, close it.
            this.infoDialog.close()
            this.infoDialog = undefined
            return
        }

        this.infoDialog = this.dialog.open(EditorTooltipsComponent);
        this.infoDialog.afterClosed().subscribe(_ => this.infoDialog = undefined)
    }
}
