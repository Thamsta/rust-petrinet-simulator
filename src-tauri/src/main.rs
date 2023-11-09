// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::Rng;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![process_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn process_data(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Vec<i32> {
  println!("input matrix: {:?}", transition_inputs);
  println!("output matrix: {:?}", transition_outputs);
  println!("input vector: {:?}", marking);
  println!("steps: {:?}", steps);

  let transition_effects = subtract_two_matrices(&transition_outputs, &transition_inputs);
  println!("effect matrix: {:?}", transition_effects);

  let mut state = marking.clone();
  for step in 0..steps {
    let active_transitions = find_active_transitions(&state, &transition_inputs);

    if active_transitions.is_empty() {
      println!("No active transitions after step {} with state {:?}.", step, state);
      return state;
    }

    let rng_index: usize = rand::thread_rng().gen_range(0..active_transitions.len());
    let t_opt = active_transitions.get(rng_index);
    let t = t_opt.unwrap();
    let effect = transition_effects.get(*t as usize);
    // println!("{} is active with effect {:?}. All effects are {:?}", t, effect, transition_effects);
    match effect {
      None => {
        panic!("Found active transition {} which is not in {:?}", t, transition_effects);
      }
      Some(e) => {
        state  = add_two_vectors(&state, &e);
      }
    }
  }

  return state;
}

fn find_active_transitions(marking: &Vec<i32>, transition_inputs: &Vec<Vec<i32>>) -> Vec<i32> {
  let mut active = Vec::new();
  for (index, input) in transition_inputs.iter().enumerate() {
    if is_greater_or_equal(&marking, &input) {
      active.push(index as i32);
      // println!("{:?} >= {:?}", marking, input)
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

fn is_greater_or_equal(arr1: &[i32], arr2: &[i32]) -> bool {
  for (num1, num2) in arr1.iter().zip(arr2.iter()) {
    if num1 < num2 {
      return false; // If any comparison fails, return false
    }
  }

  true // All comparisons succeeded, return true
}
