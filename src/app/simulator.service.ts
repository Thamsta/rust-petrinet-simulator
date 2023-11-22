import {Injectable} from '@angular/core';
import {invoke} from '@tauri-apps/api'
import {RGResponse, SimulationResponse} from "./models";

@Injectable({
    providedIn: 'root'
})
export class SimulatorService {

    async sendToSimulator(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<SimulationResponse> {
        try {
            const start = performance.now();
            const data = await invoke<SimulationResponse>('simulate_start', {
                marking: vector,
                transitionInputs: in_matrix,
                transitionOutputs: out_matrix,
                steps: steps
            });
            const end = performance.now();
            console.log(`Simulating ${steps} steps took ${end - start} milliseconds`);
            return data;
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject();
        }
    }

    async continueSimulation(steps: number): Promise<SimulationResponse> {
        try {
            const start = performance.now();
            const data = await invoke<SimulationResponse>('simulate_continue', {
                steps: steps,
            });
            const end = performance.now();
            console.log(`Simulating ${steps} steps took ${end - start} milliseconds`);
            return data;
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject()
        }
    }

    async createRG(marking: number[], pxt_in: number[][], pxt_out: number[][]) {
        try {
            const start = performance.now();
            const data = await invoke<RGResponse>('create_rg', {marking: marking, transitionInputs: pxt_in, transitionOutputs: pxt_out});
            const end = performance.now();
            const total = end - start;
            console.log(data, "took", total, "ms")
            return data
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject();
        }
    }
}
