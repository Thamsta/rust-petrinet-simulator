use ndarray::{Array1, arr1};

pub(crate) fn find_active_transitions(marking: &Array1<i32>, transition_inputs: &Vec<Vec<i32>>) -> Vec<i32> {
    let mut active = Vec::new();
    for (index, input) in transition_inputs.iter().enumerate() {
        if is_greater_or_equal(&marking, &input) {
            active.push(index as i32);
        }
    }

    return active;
}

pub fn subtract_two_matrices(mat1: &Vec<Vec<i32>>, mat2: &Vec<Vec<i32>>) -> Vec<Vec<i32>> {
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
