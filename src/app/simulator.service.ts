import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api'

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  constructor() { }

  async sendToSimulator(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<number[]> {
    try {
      const start = performance.now();
      const result = await invoke('process_data', { marking: vector, transitionInputs: in_matrix, transitionOutputs: out_matrix, steps: steps });
      const end = performance.now();
      console.log(`Simulating ${steps} steps took ${end - start} milliseconds`);
      return result as number[];
    } catch (error) {
      console.error('Error calling the simulator:', error);
      return [];
    }
  }
}
