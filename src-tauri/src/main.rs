// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::common::{RGResponse, SimulationResponse};

mod common;
mod reachability;
mod simulator;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![simulate_start, simulate_continue, create_rg])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn simulate_start(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>, steps: i32) -> Result<SimulationResponse, String> {
    return simulator::start_simulation(marking, transition_inputs, transition_outputs, steps);
}

#[tauri::command]
fn simulate_continue(steps: i32) -> Result<SimulationResponse, String> {
    return simulator::continue_simulation(steps);
}

#[tauri::command]
fn create_rg<'a>(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>) -> Result<RGResponse, String> {
    return reachability::create_rg(marking, transition_inputs, transition_outputs);
}
