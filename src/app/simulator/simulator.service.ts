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

/**
 * Service that handles the communication with the actual simulator backend.
 * Contains an internal state machine that represents the state of the simulator and handles all simulation requests,
 * including invalid calls (e.g. continuing a non-existing simulation).
 * Only a single simulation may run at a time.
 * If a different / new simulation should be started, the previous simulation must be stopped or paused first.
 */
@Injectable({
    providedIn: 'root'
})
export class SimulatorService {

	simulationEmitter: EventEmitter<SimulationEvent> = new EventEmitter<SimulationEvent>();

	private currentState: States = States.Stopped;
    private currentUpdateTime: number = 10000
	private startState: number[] = []

    async step(state: number[], in_matrix: number[][], out_matrix: number[][]) {
		if (this.currentState == States.Running) {
			this.pause() // while running, the step command is essentially the same as pausing.
			return
		}

		if (this.currentState == States.Stopped) {
			this.startState = state
		}

		this.currentState = States.Running
		this.invokeSimulationStep(state, in_matrix, out_matrix).then(result => {
            this.emitResult(result, States.Paused)
			this.currentState = States.Paused
		})
	}

	async start(state: number[], in_matrix: number[][], out_matrix: number[][], updateTime: number) {
        if (![States.Stopped, States.Paused].includes(this.currentState)) {
			// only start the simulation if it is currently stopped or paused
            return
        }

		this.currentState = States.Running
		this.currentUpdateTime = updateTime
		this.startState = state

		this.invokeSimulationStart(state, in_matrix, out_matrix, updateTime).then(() => {
			this.continueInternal(updateTime);
		}).catch(e => this.handleError(e))
	}

    async continue() {
        if (this.currentState == States.Paused) {
            this.currentState = States.Running
            await this.continueInternal(this.currentUpdateTime)
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

	private async continueInternal(updateTime: number) {
        const result = await this.invokeSimulationContinue(updateTime)
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
		await this.continueInternal(updateTime)
    }

	private async invokeSimulationStart(vector: number[], in_matrix: number[][], out_matrix: number[][], updateTime: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_start', {
                marking: vector,
                transitionInputs: in_matrix,
                transitionOutputs: out_matrix,
                updateTime: updateTime
            });
        } catch (error) {
            this.handleError(error)
            return Promise.reject();
        }
    }

	private async invokeSimulationStep(vector: number[], in_matrix: number[][], out_matrix: number[][]): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_start_step', {
                marking: vector,
                transitionInputs: in_matrix,
                transitionOutputs: out_matrix,
            });
        } catch (error) {
            this.handleError(error)
            return Promise.reject();
        }
    }

    private async invokeSimulationContinue(updateTime: number): Promise<SimulationResponse> {
        try {
            return await invoke<SimulationResponse>('simulate_continue', {updateTime: updateTime});
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
