import {Injectable} from '@angular/core';
import {invoke} from "@tauri-apps/api";
import {RGResponse} from "../models";

@Injectable({
    providedIn: 'root'
})
export class ReachabilityGraphService {

    async createRG(marking: number[], pxt_in: number[][], pxt_out: number[][]) {
        try {
            const start = performance.now();
            const data = await invoke<RGResponse>('check_properties', {marking: marking, transitionInputs: pxt_in, transitionOutputs: pxt_out});
            const end = performance.now();
            const total = end - start;
            console.log(`Generating ${data} took ${total}ms`)
            return data
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject();
        }
    }
}
