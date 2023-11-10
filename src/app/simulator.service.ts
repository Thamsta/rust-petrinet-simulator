import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api'
import {SimulationResponse} from "./models";

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  constructor() { }

  async sendToSimulator(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<SimulationResponse> {
    try {
      const start = performance.now();
      const data = await invoke<SimulationResponse>('process_data', { marking: vector, transitionInputs: in_matrix, transitionOutputs: out_matrix, steps: steps });
      const end = performance.now();
      console.log(`Simulating ${steps} steps took ${end - start} milliseconds`);
      return data;
    } catch (error) {
      console.error('Error calling the simulator:', error);
      return Promise.reject();
    }
  }
}