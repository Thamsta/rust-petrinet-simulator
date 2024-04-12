import {Component, QueryList, ViewChildren} from '@angular/core';
import {ArcDTO, NetDTO, PlaceDTO, Position, TransitionDTO} from "../dtos";
import {v4 as uuidv4} from "uuid";
import {FormControl} from "@angular/forms";
import {
    DuplicateNetStrategies,
    ImportDuplicateDialogComponent
} from "../import-duplicate-dialog/import-duplicate-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {SimulatorService} from "../simulator/simulator.service";
import {EditorComponent} from "../editor/editor.component";
import {CloseUnsavedDialogComponent} from "../close-unsaved-dialog/close-unsaved-dialog.component";

/**
 * The window manager is the outermost component of the tool and contains all other components that should be treated
 * as windows, e.g. open editors.
 * The window manager is responsible for opening and closing any kind of window and handling all related tasks like
 * saving the content of a window before it is closed or replacing windows by ID.
 * Only a single window is active and rendered at a time, all other windows are removed from the DOM whenever the focus
 * shifts on another window.
 */
@Component({
    selector: 'app-window-manager',
    templateUrl: './window-manager.component.html',
    styleUrls: ['./window-manager.component.scss']
})
export class WindowManagerComponent {
    selected = new FormControl(0);
    openWindows: OpenWindow[] = []

    @ViewChildren(EditorComponent)
    editors!: QueryList<EditorComponent>

    constructor(private dialog: MatDialog, private simulator: SimulatorService) {
        this.openNewNet(undefined)
    }

    tabChanged(event: number) {
        this.saveCurrentWindow()

        this.selected.setValue(event)
        // always cancel any running simulation when the tab is changed.
        this.simulator.stop()
    }

    private saveCurrentWindow() {
        let i = this.selected.getRawValue()
        if (i == null || i >= this.openWindows.length || this.openWindows[i].type != WindowTypes.net) {
            return
        }

        let netWindow = this.openWindows[i]
        if (!netWindow) return

        // a net was switched. Save the content.
        let netEditor = this.editors.find(editor => editor.id === netWindow.id)
        if (!netEditor) {
            console.warn("Closed net editor with id " + netWindow.id + " that cannot be found. All changes are lost!")
            return
        }

        netWindow.net = netEditor.getNetDTO()
        netWindow.isDirty = netEditor.isDirty()
    }

    openNewNet(net: NetDTO | undefined) {
        if (net === undefined) {
            net = this.sampleNetDTO()
        }

        let window = this.findExistingNet(net.id)
        if (window == undefined) {
            this.addAndSelectNet(net)
            return
        }


        // a net with this specific id already exists. Ask user for strategy.
        const dialogRef = this.dialog.open(ImportDuplicateDialogComponent, {data: {name: net.name}});

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.strategy && net) {
                switch (result.strategy) {
                    case DuplicateNetStrategies.CANCEL:
                        return
                    case DuplicateNetStrategies.REPLACE:
                        // remove the existing net
                        this.closeTab(this.openWindows.indexOf(window!))
                        break;
                    case DuplicateNetStrategies.NEW:
                        // give the net to be loaded new id and name
                        net.id = uuidv4()
                        net.name = this.incrementName(net.name)
                        break;
                }
                this.addAndSelectNet(net)
            }
        });
    }

    private addAndSelectNet(net: NetDTO) {
        this.saveCurrentWindow()
        this.openWindows.push({type: WindowTypes.net, name: net.name ?? "new*", net: net, rg: undefined, id: net.id, isDirty: false})
        this.selected.setValue(this.openWindows.length - 1)
    }

    private incrementName(name: string) {
        const regex = /\d+(?=\D*$)/;
        const match = name.match(regex);

        if (match) {
            const number = parseInt(match[0]);
            const incrementedNumber = number + 1;
            return name.replace(regex, incrementedNumber.toString());
        } else {
            return name + '2';
        }
    }

    openNewRG(rg: string, name: string, id: string, replaceExisting: boolean) {
        if (replaceExisting) {
            this.openWindows.forEach((window, index) => {
                if (id === window.id && window.type == WindowTypes.rg) {
                    this.closeTab(index);
                }
            })
        }
        this.openWindows.push({type: WindowTypes.rg, name: name, net: undefined, rg: rg, id: id, isDirty: false})
        this.selected.setValue(this.openWindows.length - 1)
    }

    closeTab(index: number) {
        if (!this.openWindows[index].isDirty) {
            this.deleteTabUnchecked(index)
            return
        }

        // window contains unsaved work, ask the user for confirmation to close
        let name = this.openWindows[index].name
        const dialogRef = this.dialog.open(CloseUnsavedDialogComponent, {data: {name: name}});

        dialogRef.afterClosed().subscribe(result => {
            if (!result.close) {
                // cancel the closing.
                return
            } else {
                this.deleteTabUnchecked(index)
            }
        });

        return
    }

    private deleteTabUnchecked(index: number) {
        this.openWindows.splice(index, 1);
        if (this.openWindows.length == 0) {
            this.openNewNet(undefined)
        }
    }

    sampleNetDTO(): NetDTO {
        let p = new PlaceDTO(uuidv4(), new Position(150, 200), 1, "");
        let t = new TransitionDTO(uuidv4(), new Position(350, 200), "");
        let a = new ArcDTO(uuidv4(), p.id, t.id, "1", "")
        return new NetDTO(uuidv4(), "pt-net", "net", [p], [t], [a])
    }

    renameNet(name: string, dirty: boolean, id: string) {
        let window = this.findExistingNet(id)
        if (window === undefined) {
            console.log("Tried to rename net with id", id, "but it is unknown. Known nets are", this.openWindows)
            return
        }
        window.name = name
        window.isDirty = dirty
    }

    getDirtySuffix(isDirty: boolean) {
        return isDirty ? "*" : ""
    }

    private findExistingNet(id: string) {
        return this.openWindows.find(window => window.id === id && window.type === WindowTypes.net);
    }

    protected readonly WindowTypes = WindowTypes;
}

export type OpenWindow = {
    type: WindowTypes
    name: string
    net: NetDTO | undefined
    rg: string | undefined
    id: string
    isDirty: boolean
}

export enum WindowTypes {
    net,
    rg
}
