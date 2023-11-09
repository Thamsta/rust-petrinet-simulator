import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api'

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  constructor() { }

  async sendToSimulator(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<number[]> {
    try {
      const result = await invoke('process_data', { marking: vector, transitionInputs: in_matrix, transitionOutputs: out_matrix, steps: steps });
      return result as number[];
    } catch (error) {
      console.error('Error calling the simulator:', error);
      return [];
    }
  }
}
