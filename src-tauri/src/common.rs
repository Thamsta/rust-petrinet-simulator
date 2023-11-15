use derive_new::new;
use ndarray::{Array1, Array2, Axis};
use serde::Serialize;

pub(crate) fn find_active_transitions(marking: &Array1<i32>, transition_inputs: &Vec<Vec<i32>>) -> Vec<i32> {
    let mut active = Vec::new();
    for (index, input) in transition_inputs.iter().enumerate() {
        if is_greater_or_equal(&marking, &input) {
            active.push(index as i32);
        }
    }

    return active;
}

pub(crate) fn find_active_transitions_arr(marking: &Array1<i32>, transition_inputs: &Array2<i32>) -> Vec<i32> {
    let mut active_transitions = Vec::new();

    // Compare each row of the matrix to the reference array
    for (row_index, row) in transition_inputs.axis_iter(ndarray::Axis(0)).enumerate() {
        // Check whether the marking is at least as large as the edge weight.
        if marking.iter().zip(row.iter()).all(|(&a, &b)| a >= b) {
            // If the marking is large enough, the transition is active.
            active_transitions.push(row_index as i32);
        }
    }

    return active_transitions;
}

pub(crate) fn subtract_two_matrices(mat1: &Vec<Vec<i32>>, mat2: &Vec<Vec<i32>>) -> Vec<Vec<i32>> {
    let mut sum = Vec::new();
    for (c1, c2) in mat1.iter().zip(mat2.iter()) {
        sum.push(subtract_two_vectors(&c1, &c2));
    }
    return sum;
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

#[derive(Serialize, new)]
pub(crate) struct SimulationResponse {
    marking: Vec<i32>,
    firings: Vec<i32>,
}

#[derive(Serialize, new)]
pub(crate) struct RGResponse {
    success: bool,
}
