// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::time::Instant;

use ndarray::{arr1, Array1, Array2, Axis, s};
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
fn create_rg<'a>(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>) -> Result<RGResponse, String> {
    let start_time = Instant::now();
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns

    let t_in: Array2<i32> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i32> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i32> = &t_out - &t_in;

    let state_vec = arr1(&marking);
    let mut queue: Vec<Array1<i32>> = Vec::new();
    // new:
    let mut all_states: Vec<Array1<i32>> = Vec::new();
    let mut all_states_rev: HashMap<Array1<i32>, u32> = HashMap::new();
    let mut edges: HashMap<u32, Vec<u32>> = HashMap::new();


    //let id = all_states.len().clone();
    all_states_rev.insert(state_vec.clone(), all_states.len() as u32);
    all_states.push(state_vec.clone());
    queue.push(state_vec);

    while !queue.is_empty() {
        let cur_state = queue.pop().unwrap();
        let id = all_states_rev.get(&cur_state).unwrap().clone();
        let active = common::find_active_transitions_arr(&cur_state, &t_in);
        let next: Vec<u32> = active.iter()
            .map(| &inx| {
                let new_state: Array1<i32> = &cur_state + &t_effect.slice(s![inx as usize, ..]);
                return insert_next_state(new_state, &mut all_states, &mut all_states_rev, &mut queue);
            })
            .filter_map(|option| option)
            .collect();
        edges.insert(id, next);
    }

    let end_time = Instant::now();
    let elapsed_time = end_time - start_time;

    let total_states = all_states_rev.keys().len();
    let states_per_second = total_states as f64 / elapsed_time.as_secs_f64() / 1000f64;

    println!("RG with {:?} states took {}ms ({}k states/s)", total_states, elapsed_time.as_millis(), states_per_second.round());

    return Ok(RGResponse { success: true });
}

fn insert_next_state(new_state: Array1<i32>, all_states: &mut Vec<Array1<i32>>, all_states_rev: &mut HashMap<Array1<i32>, u32>, queue: &mut Vec<Array1<i32>>) -> Option<u32> {
    let existing = all_states_rev.get(&new_state);
    match existing {
        None => {
            all_states_rev.insert(new_state.clone(), all_states.len() as u32);
            all_states.push(new_state.clone());
            queue.push(new_state.clone());
        }
        Some(actual) => {
            return Some(actual.clone());
        }
    }
    return None
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

#[derive(Debug)]
struct Node {
    id: u32,
    state: Array1<i32>,
    next: Vec<u32>
}


#[derive(Serialize)]
struct RGResponse {
    success: bool,
}
