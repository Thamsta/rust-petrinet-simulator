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

@NgModule({
	declarations: [
		AppComponent,
		CanvasComponent,
		ToolbarComponent,
		InfoBarComponent,
		ShortcutDirective,
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
