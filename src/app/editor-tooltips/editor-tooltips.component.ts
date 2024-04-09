import {Component} from '@angular/core';

export interface ShortcutEntry {
  name: string;
  key: string;
  description: string;
}

export interface ShortcutTable {
  title: string;
  content: ShortcutEntry[]
}

const EDITOR_SHORTCUTS: ShortcutEntry[] = [
  {key: 'Ctrl + N', name: 'New', description: 'Opens a new editor window'},
  {key: 'Ctrl + S', name: 'Save', description: 'Saves the current net.'},
  {key: 'Ctrl + O', name: 'Open', description: 'Opens a net from a file.'},
  {key: 'S', name: 'Select', description: 'Default selection tool.'},
  {key: 'Del / Backspace', name: 'Delete', description: 'Deletes the current selection.'},
  {key: 'P', name: 'Place', description: 'Adds a place at the position of the next mouse click within the editor. Press ctrl while clicking to add multiple places.'},
  {key: 'T', name: 'Transition', description: 'Adds a transition at the position of the next mouse click within the editor. Press ctrl while clicking to add multiple transitions.'},
  {key: 'A', name: 'Arc', description: 'Adds an arc between the next two valid selected components. Press ctrl while clicking to add multiple arcs.'},
  {key: 'N', name: 'Names', description: 'Toggles the display of element names.'},
  {key: '+', name: 'Increase', description: 'Increases the value of selected elements by 1. Use ctrl to increase in steps of 5.'},
  {key: '-', name: 'Decrease', description: 'Decreases the value of selected elements by 1. Use ctrl to decrease in steps of 5.'},
  {key: 'M', name: 'Reachability Graph', description: 'Generates the reachability graph.'},
  {key: 'I', name: 'Info', description: 'Opens this window.'},
];

const SIMULATION_SHORTCUTS: ShortcutEntry[] = [
  {key: 'Q', name: 'Run', description: 'Start/Continue the simulation.'},
  {key: 'W', name: 'Step', description: 'Executes a single step.'},
  {key: 'E', name: 'Pause', description: 'Pauses the current simulation.'},
  {key: 'R', name: 'Stop', description: 'Stops and exits the current simulation.'},
];

const SHORTCUT_TABLES: ShortcutTable[] = [
  {title: "Editor", content: EDITOR_SHORTCUTS},
  {title: "Simulation", content: SIMULATION_SHORTCUTS},
]

@Component({
  selector: 'app-editor-tooltips',
  templateUrl: './editor-tooltips.component.html',
  styleUrls: ['./editor-tooltips.component.scss']
})
export class EditorTooltipsComponent {
  displayedColumns: string[] = ['key', 'name', 'description'];
  protected readonly SHORTCUTS_TABLES = SHORTCUT_TABLES;
}
