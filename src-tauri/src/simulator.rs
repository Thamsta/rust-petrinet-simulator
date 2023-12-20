use std::sync::{Mutex, MutexGuard};

use lazy_static::lazy_static;
use ndarray::{arr1, Array1, Array2};
use petgraph::matrix_graph::Zero;
use rand::Rng;

use crate::common::*;

struct SimulatorState {
    state: State,
    t_in: Matrix,
    t_effect: Matrix,
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
    let t = &transition_inputs.len(); // rows: number of transitions
    if t.is_zero() {
        return handle_no_transitions(marking);
    }

    let p = &transition_inputs.get(0).unwrap().len(); // columns: number of places
    if p.is_zero() {
        return handle_no_transitions(marking);
    } // TODO: correctly handle nets with no places

    let t_in: Matrix = input_matrix_to_matrix(&transition_inputs, &t, &p);
    let t_out: Matrix = input_matrix_to_matrix(&transition_outputs, &t, &p);
    let t_effect: Matrix = &t_out - &t_in;
    let firing_updates: FiringUpdates = create_firing_updates(&t_in, &t_out, &t, &p);

    println!("{:?}", firing_updates);

    return match SIMULATOR_STATE.lock() {
        Ok(mut state) => {
            state.t_in = t_in;
            state.t_effect = t_effect;
            state.deadlocked = false;
            state.firing_updates = firing_updates;
            simulate(arr1(&marking), steps, state)
        }
        Err(_) => Err("Could not acquire lock!".to_string()),
    };
}

pub(crate) fn continue_simulation(steps: i16) -> Result<SimulationResponse, String> {
    return match SIMULATOR_STATE.lock() {
        Ok(state) => {
            if state.deadlocked {
                return Ok(SimulationResponse::new(state.state.to_vec(), vec![], true));
            }
            simulate(
                state.state.clone(),
                steps,
                state,
            )
        }
        Err(_) => Err("Could not read simulation state: ".to_string()),
    };
}

fn simulate(
    marking: State,
    steps: i16,
    mut lock: MutexGuard<SimulatorState>,
) -> Result<SimulationResponse, String> {
    let mut state_vec = marking.clone();
    let mut t_heat: Vec<i16> = Vec::new();
    let t_in = &lock.t_in;
    let t_effect = &lock.t_effect;
    let firing_updates = &lock.firing_updates;
    for _ in 0..t_in.len() {
        t_heat.push(0);
    }

    let mut active_transitions_new: Vec<i16> = Vec::new();
    for step in 0..steps {
        let active_transitions = find_active_transitions(&state_vec, t_in);

        if active_transitions.is_empty() {
            println!(
                "No active transitions after step {} with state {:?}.",
                step, state_vec
            );

            lock.deadlocked = true;
            return Ok(SimulationResponse::new(state_vec.to_vec(), t_heat, true));
        }

        let t = select_transition(&active_transitions);
        t_heat[t] += 1;
        state_vec = fire_transition(&state_vec, t_effect, t);
    }

    let result_marking = state_vec.to_vec();
    lock.state = state_vec;

    return Ok(SimulationResponse::new(result_marking, t_heat, false));
}

fn select_transition(active_transitions: &Vec<i16>) -> usize {
    let rng_index: usize = rand::thread_rng().gen_range(0..active_transitions.len());
    return *active_transitions.get(rng_index).unwrap() as usize;
}

fn handle_no_transitions(marking: Vec<i16>) -> Result<SimulationResponse, String> {
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
