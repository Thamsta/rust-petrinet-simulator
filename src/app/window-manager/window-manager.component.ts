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
        {type: WindowTypes.net, name: "My Net", net: this.sampleNetDTO(), rg: undefined},
        {type: WindowTypes.net, name: "My Net 2", net: this.sampleNetDTO(), rg: undefined},
        {type: WindowTypes.rg, name: "My Net RG", net: undefined, rg: "digraph {\n" +
                "    0 [ label = \"[2, 0, 0]\"]\n" +
                "    1 [ label = \"[1, 0, 1]\"]\n" +
                "    2 [ label = \"[1, 1, 0]\"]\n" +
                "    3 [ label = \"[0, 1, 1]\"]\n" +
                "    4 [ label = \"[0, 2, 0]\"]\n" +
                "    5 [ label = \"[0, 0, 2]\"]\n" +
                "    0 -> 1 [ label = \"0\"]\n" +
                "    0 -> 2 [ label = \"2\"]\n" +
                "    2 -> 3 [ label = \"0\"]\n" +
                "    2 -> 4 [ label = \"2\"]\n" +
                "    3 -> 4 [ label = \"1\"]\n" +
                "    1 -> 5 [ label = \"0\"]\n" +
                "    1 -> 2 [ label = \"1\"]\n" +
                "    1 -> 3 [ label = \"2\"]\n" +
                "    5 -> 3 [ label = \"1\"]\n" +
                "}\n"},
        {type: WindowTypes.rg, name: "My Net RG", net: undefined, rg: "digraph {\n" +
                "    0 [ label = \"[hello world]\"]\n" +
                "    1 [ label = \"[1, 0, 1]\"]\n" +
                "    2 [ label = \"[1, 1, 0]\"]\n" +
                "    3 [ label = \"[0, 1, 1]\"]\n" +
                "    0 -> 1 [ label = \"0\"]\n" +
                "    0 -> 2 [ label = \"2\"]\n" +
                "    2 -> 3 [ label = \"0\"]\n" +
                "    1 -> 2 [ label = \"1\"]\n" +
                "    1 -> 3 [ label = \"2\"]\n" +
                "}\n"},
    ]

    openNewNet(net: NetDTO) {
        this.openWindows.push({type: WindowTypes.net, name: net.name, net: net, rg: undefined})
        this.selected.setValue(this.openWindows.length - 1)
    }

    openNewRG(rg: string, name: string) {
        this.openWindows.push({type: WindowTypes.rg, name: name, net: undefined, rg: rg})
        this.selected.setValue(this.openWindows.length - 1)
    }

    removeTab(index: number) {
        this.openWindows.splice(index, 1);
        if (this.openWindows.length == 0) {
            this.openWindows = [{type: WindowTypes.net, name: "new*", net: undefined, rg: undefined}]
        }
    }

    sampleNetDTO(): NetDTO {
        let p = new PlaceDTO(uuidv4(), new Position(150, 250), 1, "");
        let t = new TransitionDTO(uuidv4(), new Position(350, 250), "");
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
}

export enum WindowTypes {
    net,
    rg
}
