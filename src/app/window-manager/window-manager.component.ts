import { Component } from '@angular/core';

@Component({
  selector: 'app-window-manager',
  templateUrl: './window-manager.component.html',
  styleUrls: ['./window-manager.component.scss']
})
export class WindowManagerComponent {
    openWindows: OpenWindow[] = [
        {type: "net", name: "My Net", content: "some content"},
        {type: "rg", name: "My Net RG", content: "digraph {\n" +
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
}

export type OpenWindow = {
    type: string
    name: string
    content: string
}
