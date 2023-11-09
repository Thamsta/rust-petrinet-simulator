// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![process_data])
    // .invoke_handler(tauri::generate_handler![greet])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}!", name)
}

#[tauri::command]
fn process_data(marking: Vec<i32>, input_matrix: Vec<Vec<i32>>, steps: i32) -> Vec<i32> {
  println!("input matrix: {:?}", input_matrix);
  println!("input vector: {:?}", marking);
  println!("steps: {:?}", steps);

  // Perform operations using the input_vector and input_matrix
  // Placeholder return for demonstration purposes
  let output_vector: Vec<i32> = vec![]; // Replace vec![] with the processed vector
  // Perform your calculations or operations using input_vector and input_matrix
  // Update output_vector with the result of the operations

  // Return the resulting output vector
  output_vector
}
