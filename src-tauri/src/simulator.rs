use ndarray::arr1;
use rand::Rng;

use crate::common::*;

pub(crate) fn simulate(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Result<SimulationResponse, String> {
    let transition_effects = subtract_two_matrices(&transition_outputs, &transition_inputs);

    let mut state_vec = arr1(&marking);
    let mut t_heat: Vec<i32> = Vec::new();
    for _ in 0..transition_inputs.len() {
        t_heat.push(0);
    }
    for step in 0..steps {
        let active_transitions = find_active_transitions(&state_vec, &transition_inputs);

        if active_transitions.is_empty() {
            println!("No active transitions after step {} with state {:?}.", step, state_vec);

            return Ok(SimulationResponse::new(state_vec.to_vec(), t_heat));
        }

        let rng_index: usize = rand::thread_rng().gen_range(0..active_transitions.len());
        let t_opt = active_transitions.get(rng_index);
        let t = *t_opt.unwrap() as usize;
        let effect = transition_effects.get(t);
        t_heat[t] += 1;
        // println!("{} is active with effect {:?}. All effects are {:?}", t, effect, transition_effects);
        match effect {
            None => {
                println!("Found active transition {} which is not in {:?}", t, transition_effects);
                return Err("Internal Error".to_string());
            }
            Some(e) => {
                state_vec = &state_vec + &arr1(&e);
            }
        }
    }

    return Ok(SimulationResponse::new(state_vec.to_vec(), t_heat));
}
