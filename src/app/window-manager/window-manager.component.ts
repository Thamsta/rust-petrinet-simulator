import {Component} from '@angular/core';
import {ArcDTO, NetDTO, PlaceDTO, Position, TransitionDTO} from "../dtos";
import {v4 as uuidv4} from "uuid";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'app-window-manager',
    templateUrl: './window-manager.component.html',
    styleUrls: ['./window-manager.component.scss']
})
export class WindowManagerComponent {
    selected = new FormControl(0);
    openWindows: OpenWindow[] = [
        {type: WindowTypes.net, name: "new*", net: this.sampleNetDTO(), rg: undefined, rgId: ""}
    ]

    openNewNet(net: NetDTO | undefined) {
        this.openWindows.push({type: WindowTypes.net, name: net?.name ?? "new*", net: net, rg: undefined, rgId: ""})
        this.selected.setValue(this.openWindows.length - 1)
    }

    openNewRG(rg: string, name: string, id: string, replaceExisting: boolean) {
        if (replaceExisting) {
            this.openWindows.map(window => window.rgId)
                .forEach((rgId, index) => {
                    if (id === rgId) {
                        this.removeTab(index);
                    }
                })
        }
        this.openWindows.push({type: WindowTypes.rg, name: name, net: undefined, rg: rg, rgId: id})
        this.selected.setValue(this.openWindows.length - 1)
    }

    removeTab(index: number) {
        this.openWindows.splice(index, 1);
        if (this.openWindows.length == 0) {
            this.openWindows = [{type: WindowTypes.net, name: "new*", net: undefined, rg: undefined, rgId: ""}]
        }
    }

    sampleNetDTO(): NetDTO {
        let p = new PlaceDTO(uuidv4(), new Position(150, 200), 1, "");
        let t = new TransitionDTO(uuidv4(), new Position(350, 200), "");
        let a = new ArcDTO(uuidv4(), p.id, t.id, "1", "")
        return new NetDTO(uuidv4(), "pt-net", "net", [p], [t], [a])
    }

    protected readonly WindowTypes = WindowTypes;
}

export type OpenWindow = {
    type: WindowTypes
    name: string
    net: NetDTO | undefined
    rg: string | undefined
    rgId: string
}

export enum WindowTypes {
    net,
    rg
}
