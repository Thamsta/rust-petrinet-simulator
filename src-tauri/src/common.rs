use std::collections::{HashMap, HashSet};

use derive_new::new;
use ndarray::{s, Array1, Array2, Axis};
use petgraph::graph::DiGraph;
use serde::Serialize;

pub(crate) fn fire_transition(state: &State, effect_matrix: &PTMatrix, t: usize) -> State {
    state + &effect_matrix.slice(s![t, ..])
}

pub(crate) fn find_active_transitions(marking: &State, transition_inputs: &PTMatrix) -> InputState {
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

pub(crate) fn find_active_transitions_from_firing_set(
    marking: &State,
    transition_inputs: &PTMatrix,
    mut last_step_active: InputState,
    firing_updates: &FiringUpdates,
    last_fired: &usize,
) -> InputState {
    if (last_step_active.len()) == 0 {
        return find_active_transitions(marking, transition_inputs);
    }

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
            let enabled = marking.iter().zip(row.iter()).all(|(&a, &b)| a >= b);

            // is newly enabled
            if enabled && add_if_enabled {
                last_step_active.push(*row_index_i16)
            }
            // was enabled but is now disabled
            else if !enabled && remove_if_disabled {
                if let Some(index) = last_step_active.iter().position(|x| x == row_index_i16) {
                    last_step_active.remove(index);
                }
            }
        }
    }

    return last_step_active;
}

pub(crate) fn create_firing_updates(t_in: &PTMatrix, t_out: &PTMatrix) -> FiringUpdates {
    let places = t_in.place_count();
    let transitions = t_in.transition_count();
    let mut adds_tokens_to: HashMap<usize, InputState> = HashMap::new(); // transition add to places
    let mut has_tokens_removed_from: HashMap<usize, InputState> = HashMap::new(); // place have tokens removed by transitions

    for p in 0..places {
        has_tokens_removed_from.insert(p, Vec::new());
    }

    for t in 0..transitions {
        let transition_consumes = t_in.slice(s![t, ..]);
        let transition_creates = t_out.slice(s![t, ..]);
        adds_tokens_to.insert(t, Vec::new());
        for p in 0..transition_creates.len_of(Axis(0)) {
            if transition_creates[[p]] > 0 {
                adds_tokens_to.get_mut(&t).unwrap().push(p as i16);
            }
            if transition_consumes[[p]] > 0 {
                has_tokens_removed_from.get_mut(&p).unwrap().push(t as i16);
            }
        }
    }

    let mut can_enable: HashMap<usize, HashSet<i16>> = HashMap::new();
    let mut might_disable: HashMap<usize, HashSet<i16>> = HashMap::new();
    for t in 0..transitions {
        let mut enables: HashSet<i16> = HashSet::new();
        // every transition that adds a token to 'p' might activate all transitions that consume from 'p'
        let adds_to_places = adds_tokens_to.get(&t).unwrap();
        adds_to_places.iter().for_each(|&p| {
            let all_places = has_tokens_removed_from.get(&(p as usize)).unwrap();
            all_places.iter().for_each(|p| {
                enables.insert(p.clone());
            });
        });
        can_enable.insert(t, enables);

        let mut disables: HashSet<i16> = HashSet::new();
        // every transition that consumes a token from 'p' might disable other transitions that consume from 'p'
        has_tokens_removed_from
            .values()
            .for_each(|consuming_transitions| {
                if consuming_transitions.contains(&(t as i16)) {
                    consuming_transitions.iter().for_each(|other_transition| {
                        disables.insert(other_transition.clone());
                    })
                }
            });
        might_disable.insert(t, disables);
    }

    return FiringUpdates {
        can_enable,
        might_disable,
    };
}

pub(crate) fn input_matrix_to_matrix(input: &InputMatrix) -> PTMatrix {
    let rows = input.transition_count();
    let columns = input.place_count();
    let mut result = Array2::zeros((rows, columns));
    for (i, mut row) in result.axis_iter_mut(Axis(0)).enumerate() {
        for (j, col) in row.iter_mut().enumerate() {
            *col = input[i][j];
        }
    }

    return result;
}

pub type InputState = Vec<i16>;
pub type InputMatrix = Vec<InputState>;
pub type State = Array1<i16>;
pub type PTMatrix = Array2<i16>;
pub type ReachabilityGraph = DiGraph<State, i16>;

pub(crate) trait PTDimensions {
    fn transition_count(&self) -> usize;
    fn place_count(&self) -> usize;
}

impl PTDimensions for PTMatrix {
    fn transition_count(&self) -> usize {
        PTMatrix::shape(&self)[0]
    }

    fn place_count(&self) -> usize {
        PTMatrix::shape(&self)[1]
    }
}

impl PTDimensions for InputMatrix {
    fn transition_count(&self) -> usize {
        return self.len();
    }

    fn place_count(&self) -> usize {
        self.get(0).map_or_else(|| 0, |v| v.len())
    }
}

/// Response struct to return for a simulation request
#[derive(Serialize, new)]
pub struct SimulationResponse {
    pub marking: InputState,
    pub firings: InputState,
    pub deadlocked: bool,
}

/// Response struct to return for a RG request
#[derive(Serialize)]
pub struct RGResponse {
    pub states: usize,
    pub edges: usize,
    pub reversible: bool,
    pub liveness: bool,
    pub bounded: i16,
    pub bounded_vec: Vec<i16>,
    pub has_deadlock: bool,
    pub dot_graph: String,
    pub message: String,
}

/// An internal struct that describes the result of a RG generation
pub struct RGResult {
    pub rg: ReachabilityGraph,
    pub has_deadlock: bool,
}

#[derive(Debug)]
pub struct RGProperties {
    pub liveness: bool,
    pub reversible: bool,
    pub bounded_vec: Vec<i16>,
    pub k_bounded: i16,
    pub has_deadlock: bool,
}

impl RGResponse {
    pub(crate) fn unbounded() -> Self {
        RGResponse {
            states: 0,
            edges: 0,
            reversible: false,
            liveness: false,
            bounded: -1,
            bounded_vec: Vec::new(),
            has_deadlock: false,
            dot_graph: "".to_string(),
            message: "Graph is unbounded".to_string(),
        }
    }

    pub(crate) fn success(
        graph: &ReachabilityGraph,
        properties: &RGProperties,
        dot_graph: String,
        message: String,
    ) -> Self {
        RGResponse {
            states: graph.node_count(),
            edges: graph.edge_count(),
            reversible: properties.reversible,
            liveness: properties.liveness,
            bounded: properties.k_bounded,
            bounded_vec: properties.bounded_vec.clone(),
            has_deadlock: properties.has_deadlock,
            dot_graph,
            message,
        }
    }
}

#[derive(Debug)]
pub(crate) struct FiringUpdates {
    pub(crate) can_enable: HashMap<usize, HashSet<i16>>,
    pub(crate) might_disable: HashMap<usize, HashSet<i16>>,
}

impl Default for FiringUpdates {
    fn default() -> Self {
        FiringUpdates {
            can_enable: Default::default(),
            might_disable: Default::default(),
        }
    }
}
