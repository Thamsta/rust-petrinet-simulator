use std::sync::{Mutex, MutexGuard};
use std::time::Instant;

use lazy_static::lazy_static;
use ndarray::{arr1, Array1, Array2};
use petgraph::matrix_graph::Zero;
use rand::Rng;

use crate::common::*;

struct SimulatorState {
    state: State,
    t_in: PTMatrix,
    t_effect: PTMatrix,
    deadlocked: bool,
    firing_updates: FiringUpdates,
}

lazy_static! {
    static ref SIMULATOR_STATE: Mutex<SimulatorState> = Mutex::new(SimulatorState {
        state: Array1::zeros(0),
        t_in: Array2::zeros((0, 0)),
        t_effect: Array2::zeros((0, 0)),
        deadlocked: false,
        firing_updates: FiringUpdates::default()
    });
}

pub(crate) fn start_simulation(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
    steps: i16,
) -> Result<SimulationResponse, String> {
    if transition_inputs.transition_count().is_zero() {
        return handle_no_transitions(marking);
    }

    if transition_inputs.place_count().is_zero() {
        // TODO: correctly handle nets with no places
        return handle_no_transitions(marking);
    }

    let t_in: PTMatrix = input_matrix_to_matrix(&transition_inputs);
    let t_out: PTMatrix = input_matrix_to_matrix(&transition_outputs);
    let t_effect: PTMatrix = &t_out - &t_in;
    let firing_updates: FiringUpdates = create_firing_updates(&t_in, &t_out);

    println!("🆕Starting new simulation.");

    return match SIMULATOR_STATE.lock() {
        Ok(mut state) => {
            state.t_in = t_in;
            state.t_effect = t_effect;
            state.deadlocked = false;
            state.firing_updates = firing_updates;
            simulate(arr1(&marking), steps, state)
        }
        Err(_) => Err("❌Could not acquire lock!".to_string()),
    };
}

pub(crate) fn continue_simulation(steps: i16) -> Result<SimulationResponse, String> {
    return match SIMULATOR_STATE.lock() {
        Ok(state) => {
            if state.deadlocked {
                println!("☠️Trying to continue but simulation is still deadlocked.");
                return Ok(SimulationResponse::new(state.state.to_vec(), vec![], true));
            }
            println!("↪️Continuing simulation.");
            simulate(state.state.clone(), steps, state)
        }
        Err(_) => Err("❌Could not acquire lock!".to_string()),
    };
}

fn simulate(
    marking: State,
    steps: i16,
    mut lock: MutexGuard<SimulatorState>,
) -> Result<SimulationResponse, String> {
    let mut state_vec = marking.clone();
    let mut t_heat: InputState = Vec::new();
    let t_in = &lock.t_in;
    let t_effect = &lock.t_effect;
    let firing_updates = &lock.firing_updates;

    for _ in 0..t_in.transition_count() {
        t_heat.push(0);
    }

    let mut active_transitions: InputState = Vec::new();
    let mut fired: usize = 0;
    let start = Instant::now();
    for step in 0..steps {
        active_transitions = find_active_transitions_from_firing_set(
            &state_vec,
            t_in,
            active_transitions,
            firing_updates,
            &fired,
        );

        if active_transitions.is_empty() {
            println!(
                "☠️No active transitions after step {} with state {:?}.",
                step, state_vec
            );

            let result_marking = state_vec.to_vec();
            lock.state = state_vec;
            lock.deadlocked = true;
            return Ok(SimulationResponse::new(result_marking, t_heat, true));
        }

        fired = select_transition(&active_transitions);
        t_heat[fired] += 1;
        state_vec = fire_transition(&state_vec, t_effect, fired);
    }

    let end = Instant::now();
    let took_ms = (end - start).as_millis();

    println!("🔄Simulating {} steps took {}ms", steps, took_ms);

    let result_marking = state_vec.to_vec();
    lock.state = state_vec;

    return Ok(SimulationResponse::new(result_marking, t_heat, false));
}

fn select_transition(active_transitions: &InputState) -> usize {
    let rng_index: usize = rand::thread_rng().gen_range(0..active_transitions.len());
    return *active_transitions.get(rng_index).unwrap() as usize;
}

fn handle_no_transitions(marking: InputState) -> Result<SimulationResponse, String> {
    match SIMULATOR_STATE.lock() {
        Ok(mut state) => {
            state.t_in = Array2::zeros((0, 0));
            state.t_effect = Array2::zeros((0, 0));
            state.deadlocked = true;
        }
        Err(_) => return Err("Could not acquire lock!".to_string()),
    };
    return Ok(SimulationResponse::new(marking, vec![], true));
}
