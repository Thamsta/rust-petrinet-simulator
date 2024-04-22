import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {CanvasComponent} from './canvas/canvas.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDividerModule} from "@angular/material/divider";
import {ShortcutDirective} from './directives/shortcut.directive';
import {ExportComponent} from './export/export.component';
import {ImportComponent} from './import/import.component';
import {EditorComponent} from './editor/editor.component';
import {WindowManagerComponent} from './window-manager/window-manager.component';
import {MatTabsModule} from "@angular/material/tabs";
import {ReachabilityGraphComponent} from './reachability-graph/reachability-graph.component';
import {MatDialogModule} from "@angular/material/dialog";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {BaseToolbarComponent} from './base-toolbar/base-toolbar.component';
import {ReachabilityGraphToolbarComponent} from './reachability-graph-toolbar/reachability-graph-toolbar.component';
import {EditorToolbarComponent} from './editor-toolbar/editor-toolbar.component';
import {EditorTooltipsComponent} from './editor-tooltips/editor-tooltips.component';
import {MatTableModule} from "@angular/material/table";
import {ImportDuplicateDialogComponent} from './import-duplicate-dialog/import-duplicate-dialog.component';
import {CloseUnsavedDialogComponent} from './close-unsaved-dialog/close-unsaved-dialog.component';
import {EditorRgInfobarComponent} from './editor-rg-infobar/editor-rg-infobar.component';
import {EditorOpenRgDialogComponent} from './editor-open-rg-dialog/editor-open-rg-dialog.component';
import {ColoringComponent} from './coloring/coloring.component';
import {CdkConnectedOverlay, CdkOverlayOrigin} from "@angular/cdk/overlay";

@NgModule({
    declarations: [
        AppComponent,
        CanvasComponent,
        ShortcutDirective,
        ExportComponent,
        ImportComponent,
        EditorComponent,
        WindowManagerComponent,
        ReachabilityGraphComponent,
        BaseToolbarComponent,
        ReachabilityGraphToolbarComponent,
        EditorToolbarComponent,
        EditorTooltipsComponent,
        ImportDuplicateDialogComponent,
        CloseUnsavedDialogComponent,
        EditorRgInfobarComponent,
        EditorOpenRgDialogComponent,
        ColoringComponent,
    ],
    imports: [
        BrowserModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        BrowserAnimationsModule,
        MatDividerModule,
        MatTabsModule,
        MatDialogModule,
        MatCheckboxModule,
        FormsModule,
        MatTableModule,
        CdkOverlayOrigin,
        CdkConnectedOverlay
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
