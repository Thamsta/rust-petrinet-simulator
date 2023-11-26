import {Component, EventEmitter, Output} from '@angular/core';
import {DrawingTools, isRunCommand} from '../models';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
    protected readonly DrawingTools = DrawingTools;
    selected: DrawingTools = DrawingTools.SELECT;

    @Output()
    controlEmitter = new EventEmitter<DrawingTools>


    select(selected: DrawingTools) {
        this.selected = selected;
        if (isRunCommand(selected) || selected == DrawingTools.RG) {
            this.controlEmitter.emit(selected)
            if (selected == DrawingTools.STOP || selected == DrawingTools.RG) {
                this.selected = DrawingTools.SELECT
            } else if (selected == DrawingTools.STEP) {
                this.selected = DrawingTools.PAUSE
            }
        }
    }

}
