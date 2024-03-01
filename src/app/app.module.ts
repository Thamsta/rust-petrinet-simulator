import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {CanvasComponent} from './canvas/canvas.component';
import {ToolbarComponent} from './toolbar/toolbar.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDividerModule} from "@angular/material/divider";
import {InfoBarComponent} from './infobar/info-bar.component';
import {ShortcutDirective} from './directives/shortcut.directive';
import {MatTooltipModule} from "@angular/material/tooltip";
import { ExportComponent } from './export/export.component';
import { ImportComponent } from './import/import.component';
import { EditorComponent } from './editor/editor.component';
import { GraphvizComponent } from './graphviz/graphviz.component';

@NgModule({
	declarations: [
		AppComponent,
		CanvasComponent,
		ToolbarComponent,
		InfoBarComponent,
		ShortcutDirective,
  ExportComponent,
  ImportComponent,
  EditorComponent,
  GraphvizComponent,
	],
	imports: [
		BrowserModule,
		MatToolbarModule,
		MatIconModule,
		MatButtonModule,
		BrowserAnimationsModule,
		MatDividerModule,
		MatTooltipModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}
