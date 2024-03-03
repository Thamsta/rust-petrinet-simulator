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
import {ExportComponent} from './export/export.component';
import {ImportComponent} from './import/import.component';
import {EditorComponent} from './editor/editor.component';
import {WindowManagerComponent} from './window-manager/window-manager.component';
import {MatTabsModule} from "@angular/material/tabs";
import {ReachabilityGraphComponent} from './reachability-graph/reachability-graph.component';
import { RgDialogComponent } from './rg-dialog/rg-dialog.component';
import {MatDialogModule} from "@angular/material/dialog";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";

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
        WindowManagerComponent,
        ReachabilityGraphComponent,
        RgDialogComponent,
    ],
    imports: [
        BrowserModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        BrowserAnimationsModule,
        MatDividerModule,
        MatTooltipModule,
        MatTabsModule,
        MatDialogModule,
        MatCheckboxModule,
        FormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
