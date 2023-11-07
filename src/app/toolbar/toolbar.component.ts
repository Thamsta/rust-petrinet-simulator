import {Component} from '@angular/core';
import {DrawingTools} from '../models';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  protected readonly DrawingTools = DrawingTools;
  selected: DrawingTools = DrawingTools.SELECT;


  select(selected: DrawingTools) {
    this.selected = selected;
  }

}
