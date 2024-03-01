import { Component } from '@angular/core';
import {ArcDTO, NetDTO, PlaceDTO, Position, TransitionDTO} from "../dtos";
import {v4 as uuidv4} from "uuid";
import {MatTabChangeEvent} from "@angular/material/tabs";

@Component({
  selector: 'app-window-manager',
  templateUrl: './window-manager.component.html',
  styleUrls: ['./window-manager.component.scss']
})
export class WindowManagerComponent {
    openWindows: OpenWindow[] = [
        {type: WindowTypes.net, name: "My Net", net: this.sampleNetDTO(), rg: undefined},
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
    ]

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
