use derive_new::new;
use ndarray::{Array1, Array2, Axis, s};
use serde::Serialize;

pub(crate) fn fire_transition(state: &Array1<i32>, effect_matrix: &Array2<i32>, t: usize) -> Array1<i32> {
    state + &effect_matrix.slice(s![t, ..])
}

pub(crate) fn find_active_transitions(marking: &Array1<i32>, transition_inputs: &Array2<i32>) -> Vec<i32> {
    let mut active_transitions = Vec::new();

    // Compare each row of the matrix to the reference array
    for (row_index, row) in transition_inputs.axis_iter(Axis(0)).enumerate() {
        // Check whether the marking is at least as large as the edge weight.
        if marking.iter().zip(row.iter()).all(|(&a, &b)| a >= b) {
            // If the marking is large enough, the transition is active.
            active_transitions.push(row_index as i32);
        }
    }

    return active_transitions;
}

pub(crate) fn vec_vec_to_array2(input: &Vec<Vec<i32>>, rows: &usize, columns: &usize) -> Array2<i32> {
    let mut result = Array2::zeros((*rows, *columns));
    for (i, mut row) in result.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = input[i][j];
        }
    }

    return result;
}

#[derive(Serialize, new)]
pub struct SimulationResponse {
    marking: Vec<i32>,
    firings: Vec<i32>,
}

#[derive(Serialize, new)]
pub struct RGResponse {
    states: usize,
    edges: usize,
    reversible: bool,
}
