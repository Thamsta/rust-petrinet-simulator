use std::sync::Mutex;

use lazy_static::lazy_static;
use ndarray::{arr1, Array1, Array2};
use rand::Rng;

use crate::common::*;

struct State {
    state_vec: Array1<i32>,
    t_in: Array2<i32>,
    t_effect: Array2<i32>,
}

lazy_static! {
    static ref SIMULATOR_STATE: Mutex<State> = Mutex::new(State{
        state_vec: Array1::zeros(0),
        t_in: Array2::zeros((0,0)),
        t_effect: Array2::zeros((0,0)),
    });
}

pub(crate) fn simulate(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Result<SimulationResponse, String> {
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns
    let t_in: Array2<i32> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i32> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i32> = &t_out - &t_in;

    let mut state_vec = arr1(&marking);
    let mut t_heat: Vec<i32> = Vec::new();
    for _ in 0..transition_inputs.len() {
        t_heat.push(0);
    }
    for step in 0..steps {
        let active_transitions = find_active_transitions(&state_vec, &t_in);

        if active_transitions.is_empty() {
            println!("No active transitions after step {} with state {:?}.", step, state_vec);

            return Ok(SimulationResponse::new(state_vec.to_vec(), t_heat));
        }

        let rng_index: usize = rand::thread_rng().gen_range(0..active_transitions.len());
        let t_opt = active_transitions.get(rng_index);
        let t = *t_opt.unwrap() as usize;
        t_heat[t] += 1;
        state_vec = fire_transition(&state_vec, &t_effect, t);
    }

    match SIMULATOR_STATE.lock() {
        Ok(mut state) => {
            state.state_vec = state_vec.clone();
            state.t_in = t_in.clone();
            state.t_effect = t_effect.clone();
        }
        Err(e) => { println!("Could not save state: {:?}", e)}
    }

    return Ok(SimulationResponse::new(state_vec.to_vec(), t_heat));
}
