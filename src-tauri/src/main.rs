// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::common::{InputMatrix, InputState, RGResponse, SimulationResponse};

mod common;
mod model_checking;
mod simulator;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            simulate_start,
            simulate_start_step,
            simulate_continue,
            check_properties
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn simulate_start(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
    update_time: i16,
) -> Result<SimulationResponse, String> {
    return simulator::start_simulation(
        marking,
        transition_inputs,
        transition_outputs,
        update_time as u128,
    );
}

#[tauri::command]
fn simulate_start_step(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
) -> Result<SimulationResponse, String> {
    return simulator::start_simulation_step(marking, transition_inputs, transition_outputs);
}

#[tauri::command]
fn simulate_continue(update_time: i16) -> Result<SimulationResponse, String> {
    return simulator::continue_simulation(update_time as u128);
}

#[tauri::command]
fn check_properties(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
) -> Result<RGResponse, String> {
    return model_checking::check_properties(marking, transition_inputs, transition_outputs);
}
