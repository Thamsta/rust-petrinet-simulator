use std::collections::HashMap;
use std::time::Instant;

use ndarray::arr1;
use petgraph::graph::{DiGraph, NodeIndex};

use crate::common::*;
use crate::model_checking::coverability::is_covering;

pub(super) fn create_rg(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
) -> Result<RGResult, String> {
    let start_time_rg = Instant::now();

    let t_in: PTMatrix = input_matrix_to_matrix(&transition_inputs);
    let t_out: PTMatrix = input_matrix_to_matrix(&transition_outputs);
    let t_effect: PTMatrix = &t_out - &t_in;

    let state_vec = arr1(&marking);
    let mut queue: Vec<NodeIndex> = Vec::new();
    let mut graph = DiGraph::<State, i16>::new();
    let mut all_states_rev: HashMap<State, NodeIndex> = HashMap::new();

    let mut has_deadlock = false;

    // create & insert start node
    let start_node = graph.add_node(state_vec.clone());
    all_states_rev.insert(state_vec, start_node);
    queue.push(start_node);

    while !queue.is_empty() {
        let cur_state_idx = queue.pop().unwrap();
        let cur_state = graph.node_weight(cur_state_idx).cloned().unwrap();
        let active: Vec<i16> = find_active_transitions(&cur_state, &t_in);

        if active.is_empty() {
            has_deadlock = true;
        }

        for inx in active {
            let new_state: State = fire_transition(&cur_state, &t_effect, inx as usize);
            match all_states_rev.get(&new_state) {
                None => {
                    let new_state_idx = graph.add_node(new_state.clone());
                    graph.add_edge(cur_state_idx, new_state_idx, inx);

                    all_states_rev.insert(new_state, new_state_idx);
                    queue.push(new_state_idx);
                    if is_covering(&new_state_idx, &graph, true) {
                        return Err("Net is unbounded".to_string());
                    }
                }
                Some(existing_node_index) => {
                    graph.add_edge(cur_state_idx, existing_node_index.clone(), inx);
                }
            };
        }
    }

    let end_time_rg = Instant::now();
    let elapsed_time_rg = end_time_rg - start_time_rg;

    let total_states = graph.node_count();
    let total_edges = graph.edge_count();
    let elements_per_second =
        (total_states + total_edges) as f64 / elapsed_time_rg.as_secs_f64() / 1000f64;

    println!(
        "RG with {:?} states and {} edges took {}ms ({}k elem/s)",
        total_states,
        total_edges,
        elapsed_time_rg.as_millis(),
        elements_per_second.round()
    );

    return Ok(RGResult {
        rg: graph,
        had_deadlocks: has_deadlock,
    });
}
