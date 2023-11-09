import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api'

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  constructor() { }

  async sendToSimulator(vector: number[], matrix: number[][], steps: number): Promise<number[]> {
    try {
      const result = await invoke('process_data', { marking: vector, inputMatrix: matrix, steps: steps });
      return result as number[];
    } catch (error) {
      console.error('Error calling the simulator:', error);
      return [];
    }
  }
}
