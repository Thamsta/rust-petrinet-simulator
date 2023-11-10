// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::Rng;
use serde::Serialize;
use ndarray::{Array1, arr1};

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![simulate])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn simulate(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Result<Response, String> {
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

      return Ok(Response {
        marking: state_vec.to_vec(),
        firings: t_heat,
      })
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
        return Err("Internal Error".to_string())
      }
      Some(e) => {
        state_vec  = &state_vec + &arr1(&e);
      }
    }
  }

  return Ok(Response {
    marking: state_vec.to_vec(),
    firings: t_heat,
  })
}

#[derive(Serialize)]
struct Response {
  marking: Vec<i32>,
  firings: Vec<i32>,
}

fn find_active_transitions(marking: &Array1<i32>, transition_inputs: &Vec<Vec<i32>>) -> Vec<i32> {
  let mut active = Vec::new();
  for (index, input) in transition_inputs.iter().enumerate() {
    if is_greater_or_equal(&marking, &input) {
      active.push(index as i32);
    }
  }

  return active;
}

fn subtract_two_matrices(mat1: &Vec<Vec<i32>>, mat2: &Vec<Vec<i32>>) -> Vec<Vec<i32>> {
  let mut sum = Vec::new();
  for (c1, c2) in mat1.iter().zip(mat2.iter()) {
    sum.push(subtract_two_vectors(&c1, &c2));
  }
  return sum;
}

fn add_two_vectors(vec1: &Vec<i32>, vec2: &Vec<i32>) -> Vec<i32> {
  let mut sum = Vec::new();
  for (c1, c2) in vec1.iter().zip(vec2.iter()) {
    sum.push(c1 + c2);
  }
  return sum;
}

fn subtract_two_vectors(vec1: &Vec<i32>, vec2: &Vec<i32>) -> Vec<i32> {
  let mut sum = Vec::new();
  for (c1, c2) in vec1.iter().zip(vec2.iter()) {
    sum.push(c1 - c2);
  }
  return sum;
}

fn is_greater_or_equal(arr1: &Array1<i32>, arr2: &[i32]) -> bool {
  for (num1, num2) in arr1.iter().zip(arr2.iter()) {
    if num1 < num2 {
      return false; // If any comparison fails, return false
    }
  }

  true // All comparisons succeeded, return true
}
