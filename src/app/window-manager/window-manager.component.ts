import {Component} from '@angular/core';
import {ArcDTO, NetDTO, PlaceDTO, Position, TransitionDTO} from "../dtos";
import {v4 as uuidv4} from "uuid";
import {FormControl} from "@angular/forms";
import {
    DuplicateNetStrategies,
    LoadDuplicateDialogComponent
} from "../load-duplicate-dialog/load-duplicate-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
    selector: 'app-window-manager',
    templateUrl: './window-manager.component.html',
    styleUrls: ['./window-manager.component.scss']
})
export class WindowManagerComponent {
    selected = new FormControl(0);
    openWindows: OpenWindow[] = []

    constructor(private dialog: MatDialog) {
        this.openNewNet(undefined)
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
        const dialogRef = this.dialog.open(LoadDuplicateDialogComponent, {data: {name: net.name}});

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.strategy && net) {
                switch (result.strategy) {
                    case DuplicateNetStrategies.CANCEL:
                        return
                    case DuplicateNetStrategies.REPLACE:
                        // remove the existing net
                        this.removeTab(this.openWindows.indexOf(window!))
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
        this.openWindows.push({type: WindowTypes.net, name: net.name ?? "new*", net: net, rg: undefined, id: net.id})
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
            this.openWindows
                .filter(window => window.type === WindowTypes.rg)
                .map(window => window.id)
                .forEach((rgId, index) => {
                    if (id === rgId) {
                        this.removeTab(index);
                    }
                })
        }
        this.openWindows.push({type: WindowTypes.rg, name: name, net: undefined, rg: rg, id: id})
        this.selected.setValue(this.openWindows.length - 1)
    }

    removeTab(index: number) {
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

    renameNet(name: string, id: string) {
        let window = this.findExistingNet(id)
        if (window === undefined) {
            console.log("Tried to rename net with id", id, "but it is unknown. Known nets are", this.openWindows)
            return
        }
        window.name = name
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
}

export enum WindowTypes {
    net,
    rg
}
