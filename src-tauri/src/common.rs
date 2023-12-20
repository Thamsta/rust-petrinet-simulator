use std::collections::{HashMap, HashSet};

use derive_new::new;
use ndarray::{Array1, Array2, Axis, s};
use petgraph::graph::DiGraph;
use serde::Serialize;

pub(crate) fn fire_transition(state: &State, effect_matrix: &Matrix, t: usize) -> State {
    state + &effect_matrix.slice(s![t, ..])
}

pub(crate) fn find_active_transitions(marking: &State, transition_inputs: &Matrix) -> Vec<i16> {
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

pub(crate) fn find_active_transitions_from_firing_set(marking: &State, transition_inputs: &Matrix, mut last_step_active: Vec<i16>, firing_updates: &FiringUpdates, last_fired: &i16) -> Vec<i16> {
    // Compare each row of the matrix to the reference array
    let might_be_disabled = firing_updates.might_disable.get(last_fired).unwrap();
    let can_be_enabled = firing_updates.can_enable.get(last_fired).unwrap();
    for (row_index, row) in transition_inputs.axis_iter(Axis(0)).enumerate() {
        // Check whether the marking is at least as large as the edge weight.
        let row_index_i16 = &(row_index as i16);
        let was_active = last_step_active.contains(row_index_i16);
        let remove_if_disabled = was_active && might_be_disabled.contains(row_index_i16);
        let add_if_enabled = !was_active && can_be_enabled.contains(row_index_i16);

        if add_if_enabled || remove_if_disabled {
            // check if it is enabled
            let enabled= marking.iter().zip(row.iter()).all(|(&a, &b)| a >= b);

            // is newly enabled
            if enabled && add_if_enabled { last_step_active.push(*row_index_i16) }
            // was enabled but is now disabled
            else if !enabled && remove_if_disabled {
                if let Some(index) = last_step_active.iter().position(|&x| x == row_index_i16) {
                    last_step_active.remove(index);
                }
            }
        }
    }


    return last_step_active;
}


pub(crate) fn create_firing_updates(t_in: &Matrix, t_out: &Matrix, transitions: &usize, places: &usize) -> FiringUpdates {
    let mut adds_tokens_to: HashMap<i16, Vec<i16>> = HashMap::new(); // transition add to places
    let mut has_tokens_removed_from: HashMap<i16, Vec<i16>> = HashMap::new(); // place have tokens removed by transitions

    for p in 0..*places {
        has_tokens_removed_from.insert(p as i16, Vec::new());
    }

    for t_u in 0..*transitions {
        let t = t_u as i16;
        let transition_consumes = t_in.slice(s![t as usize, ..]);
        let transition_creates = t_out.slice(s![t as usize, ..]);
        adds_tokens_to.insert(t, Vec::new());
        for p_u in 0..transition_creates.len_of(Axis(0)) {
            let p = p_u as i16;
            if transition_creates[[p_u]] > 0 { adds_tokens_to.get_mut(&t).unwrap().push(p); }
            if transition_consumes[[p_u]] > 0 { has_tokens_removed_from.get_mut(&p).unwrap().push(t); }
        }
    }

    let mut can_enable: HashMap<i16, HashSet<i16>> = HashMap::new();
    let mut might_disable: HashMap<i16, HashSet<i16>> = HashMap::new();
    for t in 0..*transitions {
        let mut enables: HashSet<i16> = HashSet::new();
        // every transition that adds a token to 'p' might activate all transitions that consume from 'p'
        let adds_to_places = adds_tokens_to.get(&(t as i16)).unwrap();
        adds_to_places.iter().for_each(|p| {
            let all_places = has_tokens_removed_from.get(p).unwrap();
            all_places.iter().for_each(|p| {
                enables.insert(p.clone());
            });
        });
        can_enable.insert(t as i16, enables);

        let mut disables: HashSet<i16> = HashSet::new();
        // every transition that consumes a token from 'p' might disable other transitions that consume from 'p'
        has_tokens_removed_from.values().for_each(|consuming_transitions| {
            if consuming_transitions.contains(&(t as i16)) {
                consuming_transitions.iter().for_each(|other_transition| { disables.insert(other_transition.clone()); })
            }
        });
        might_disable.insert(t as i16, disables);
    }

    return FiringUpdates {
        can_enable,
        might_disable,
    }
}

pub(crate) fn input_matrix_to_matrix(input: &InputMatrix, rows: &usize, columns: &usize) -> Matrix {
    let mut result = Array2::zeros((*rows, *columns));
    for (i, mut row) in result.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = input[i][j];
        }
    }

    return result;
}

pub type InputState = Vec<i16>;
pub type InputMatrix = Vec<Vec<i16>>;
pub type State = Array1<i16>;
pub type Matrix = Array2<i16>;
pub type ReachabilityGraph = DiGraph<State, i16>;

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
        graph: &ReachabilityGraph,
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

#[derive(Debug)]
pub(crate) struct FiringUpdates {
    pub(crate) can_enable: HashMap<i16, HashSet<i16>>,
    pub(crate) might_disable: HashMap<i16, HashSet<i16>>,
}

impl Default for FiringUpdates {
    fn default() -> Self {
        FiringUpdates {
            can_enable: Default::default(),
            might_disable: Default::default(),
        }
    }
}
