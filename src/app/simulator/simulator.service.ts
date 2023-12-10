import {EventEmitter, Injectable} from '@angular/core';
import {invoke} from '@tauri-apps/api'
import {SimulationResponse} from "../models";

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
    deadlocked: boolean,
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
			this.pause() // while running, the step command is essentially the same as pausing.
			return
		}

		this.currentState = States.Running
		this.invokeSimulationStart(vector, in_matrix, out_matrix, 1).then(result => {
            this.emitResult(result, States.Paused)
			this.currentState = States.Paused
		})
	}

	async start(state: number[], in_matrix: number[][], out_matrix: number[][], steps: number) {
        if (![States.Stopped, States.Paused].includes(this.currentState)) {
			// only start the simulation if it is currently stopped or paused
            return
        }

		this.currentState = States.Running
		this.currentStepSize = steps
		this.startState = state

		this.invokeSimulationStart(state, in_matrix, out_matrix, steps).then(() => {
			this.continueInternal(steps);
		}).catch(e => this.handleError(e))
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
			this.performStop()
		}
	}

	isPaused() {
		return this.currentState == States.Paused
	}

	private async continueInternal(steps: number) {
        const result = await this.invokeSimulationContinue(steps)
        // if we know that the simulation is deadlock, we request a pause
		let nextState = result.deadlocked ? States.PauseRequested : this.currentState

        this.emitResult(result, nextState)
		if (nextState == States.StopRequested) {
			this.performStop();
			return
		}
		if (nextState == States.PauseRequested) {
			this.currentState = States.Paused
            this.emitResult(result, States.Paused)
			return
		}
		await this.continueInternal(steps)
    }

	private async invokeSimulationStart(vector: number[], in_matrix: number[][], out_matrix: number[][], steps: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_start', {
                marking: vector,
                transitionInputs: in_matrix,
                transitionOutputs: out_matrix,
                steps: steps
            });
        } catch (error) {
            this.handleError(error)
            return Promise.reject();
        }
    }

    private async invokeSimulationContinue(steps: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_continue', {steps: steps});
        } catch (error) {
            this.handleError(error)
            return Promise.reject()
        }
    }

	private handleError(e: any) {
		console.log('Error calling the simulator:', e)
		this.performStop();
	}

	private performStop() {
		this.currentState = States.Stopped
		this.simulationEmitter.emit({
			marking: this.startState,
			firings: [],
			state: States.Stopped,
			deadlocked: false,
		})
	}

    private emitResult(result: SimulationResponse, state: States) {
        this.simulationEmitter.emit({
            marking: result.marking,
            firings: result.firings,
            state: state,
            deadlocked: result.deadlocked,
        })
    }
}
