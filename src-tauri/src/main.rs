// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::common::{Matrix, RGResponse, SimulationResponse};

mod common;
mod model_checking;
mod simulator;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            simulate_start,
            simulate_continue,
            create_rg
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn simulate_start(
    marking: Vec<i16>,
    transition_inputs: Matrix,
    transition_outputs: Matrix,
    steps: i16,
) -> Result<SimulationResponse, String> {
    return simulator::start_simulation(marking, transition_inputs, transition_outputs, steps);
}

#[tauri::command]
fn simulate_continue(steps: i16) -> Result<SimulationResponse, String> {
    return simulator::continue_simulation(steps);
}

#[tauri::command]
fn create_rg<'a>(
    marking: Vec<i16>,
    transition_inputs: Matrix,
    transition_outputs: Matrix,
) -> Result<RGResponse, String> {
    return model_checking::check_properties(marking, transition_inputs, transition_outputs);
}
