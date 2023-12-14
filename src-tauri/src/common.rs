use derive_new::new;
use ndarray::{s, Array1, Array2, Axis};
use petgraph::visit::EdgeCount;
use petgraph::Graph;
use serde::Serialize;

pub(crate) fn fire_transition(
    state: &Array1<i16>,
    effect_matrix: &Array2<i16>,
    t: usize,
) -> Array1<i16> {
    state + &effect_matrix.slice(s![t, ..])
}

pub(crate) fn find_active_transitions(
    marking: &Array1<i16>,
    transition_inputs: &Array2<i16>,
) -> Vec<i16> {
    let mut active_transitions = Vec::new();

    // Compare each row of the matrix to the reference array
    for (row_index, row) in transition_inputs.axis_iter(Axis(0)).enumerate() {
        // Check whether the marking is at least as large as the edge weight.
        if marking.iter().zip(row.iter()).all(|(&a, &b)| a >= b) {
            // If the marking is large enough, the transition is active.
            active_transitions.push(row_index as i16);
        }
    }

    return active_transitions;
}

pub(crate) fn vec_vec_to_array2(input: &Matrix, rows: &usize, columns: &usize) -> Array2<i16> {
    let mut result = Array2::zeros((*rows, *columns));
    for (i, mut row) in result.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = input[i][j];
        }
    }

    return result;
}

pub type Matrix = Vec<Vec<i16>>;

#[derive(Serialize, new)]
pub struct SimulationResponse {
    pub marking: Vec<i16>,
    pub firings: Vec<i16>,
    pub deadlocked: bool,
}

#[derive(Serialize)]
pub struct RGResponse {
    pub states: usize,
    pub edges: usize,
    pub reversible: bool,
    pub liveness: bool,
    pub bounded: bool,
    pub message: String,
}

#[derive(Debug)]
pub struct RgProperties {
    pub liveness: bool,
    pub reversible: bool,
}

impl RGResponse {
    pub(crate) fn unbounded() -> Self {
        RGResponse {
            states: 0,
            edges: 0,
            reversible: false,
            liveness: false,
            bounded: false,
            message: "Graph is unbounded".to_string(),
        }
    }

    pub(crate) fn success(
        graph: &Graph<Array1<i16>, i16>,
        properties: &RgProperties,
        msg: String,
    ) -> Self {
        RGResponse {
            states: graph.node_count(),
            edges: graph.edge_count(),
            reversible: properties.reversible,
            liveness: properties.liveness,
            bounded: true,
            message: msg,
        }
    }
}
