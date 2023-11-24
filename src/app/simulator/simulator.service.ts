import {EventEmitter, Injectable} from '@angular/core';
import {invoke} from '@tauri-apps/api'
import {RGResponse, SimulationResponse} from "../models";

export enum States {
	Running = 'running',
	PauseRequested = 'pauseRequested',
	Paused = 'paused',
	StopRequested = 'stopRequested',
	Stopped = 'stopped'
}

type SimulationEvent = {
	marking: number[],
	firings: number[],
    state: States,
}

@Injectable({
    providedIn: 'root'
})
export class SimulatorService {

	simulationEmitter: EventEmitter<SimulationEvent> = new EventEmitter<SimulationEvent>();

	private currentState: States = States.Stopped;
    private currentStepSize: number = 10000
	private startState: number[] = []

    async step(vector: number[], in_matrix: number[][], out_matrix: number[][]) {
		if (this.currentState == States.Running) {
			// TODO: impl
			return
		}
		this.currentState = States.Running
		this.startSimulation(vector, in_matrix, out_matrix, 1).then(result => {
			this.simulationEmitter.emit({
				marking: result.marking,
				firings: result.firings,
				state: States.Paused,
			})
			this.currentState = States.Paused
		})
	}

	async start(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number) {
        if (![States.Stopped, States.Paused].includes(this.currentState)) {
			// only start the simulation if it is currently stopped or paused
            return
        }

		this.currentState = States.Running
		this.currentStepSize = steps
		this.startState = vector

		await this.startSimulation(vector, in_matrix, out_matrix, steps)
		await this.continueInternal(steps);
	}

    async continue() {
        if (this.currentState == States.Paused) {
            this.currentState = States.Running
            await this.continueInternal(this.currentStepSize)
        }
    }

	pause() {
        if (this.currentState == States.Running) {
            this.currentState = States.PauseRequested
        }
	}

	stop() {
		if (this.currentState == States.Running) {
			this.currentState = States.StopRequested
		} else if (this.currentState == States.Paused) {
			this.currentState = States.Stopped
			this.simulationEmitter.emit({
				marking: this.startState,
				firings: [],
				state: States.Stopped,
			})
		}
	}

	isPaused() {
		return this.currentState == States.Paused
	}

	private async continueInternal(steps: number) {
        const result = await this.continueSimulation(steps)
		let nextState = this.currentState
		this.simulationEmitter.emit({
			marking: result.marking,
			firings: result.firings,
			state: nextState,
		})
		if (nextState == States.StopRequested) {
			this.currentState = States.Stopped
			this.simulationEmitter.emit({
				marking: this.startState,
				firings: [],
				state: States.Stopped,
			})
			return
		}
		if (nextState == States.PauseRequested) {
			this.currentState = States.Paused
			this.simulationEmitter.emit({
				marking: result.marking,
				firings: result.firings,
				state: States.Paused,
			})
			return
		}
		await this.continueInternal(steps)
    }

    async startSimulation(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_start', {
                marking: vector,
                transitionInputs: in_matrix,
                transitionOutputs: out_matrix,
                steps: steps
            });
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject();
        }
    }

    private async continueSimulation(steps: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_continue', {steps: steps});
        } catch (error) {
            console.error('Error calling the simulator:', error);
            return Promise.reject()
        }
    }

	// TODO: move to other service
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
