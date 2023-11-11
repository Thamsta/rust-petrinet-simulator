// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use ndarray::{arr1, Array2, Axis};
use rand::Rng;
use serde::Serialize;

mod common;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![simulate])
        .invoke_handler(tauri::generate_handler![create_rg])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn simulate(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Result<SimulationResponse, String> {
    let transition_effects = common::subtract_two_matrices(&transition_outputs, &transition_inputs);

    let mut state_vec = arr1(&marking);
    let mut t_heat: Vec<i32> = Vec::new();
    for _ in 0..transition_inputs.len() {
        t_heat.push(0);
    }
    for step in 0..steps {
        let active_transitions = common::find_active_transitions(&state_vec, &transition_inputs);

        if active_transitions.is_empty() {
            println!("No active transitions after step {} with state {:?}.", step, state_vec);

            return Ok(SimulationResponse {
                marking: state_vec.to_vec(),
                firings: t_heat,
            });
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

    return Ok(SimulationResponse {
        marking: state_vec.to_vec(),
        firings: t_heat,
    });
}

#[derive(Serialize)]
struct SimulationResponse {
    marking: Vec<i32>,
    firings: Vec<i32>,
}

#[tauri::command]
fn create_rg(marking: Vec<u32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>) -> Result<RGResponse, String> {
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns
    let t_in: Array2<i32> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i32> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i32> = &t_out - &t_in;

    let mut state_vec = arr1(&marking);

    common::find_active_transitions_arr(&state_vec, &t_in);

    return Ok(RGResponse { success: true });
}

fn vec_vec_to_array2(input: &Vec<Vec<i32>>, rows: &usize, columns: &usize) -> Array2<i32> {
    let mut result = Array2::zeros((*rows, *columns));
    for (i, mut row) in result.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = input[i][j];
        }
    }

    return result;
}


#[derive(Serialize)]
struct RGResponse {
    success: bool,
}
