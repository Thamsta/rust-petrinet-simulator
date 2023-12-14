use std::collections::HashMap;
use std::time::Instant;

use ndarray::{arr1, Array1, Array2};
use petgraph::graph::{DiGraph, NodeIndex};

use crate::common::*;
use crate::reachability::coverability::is_covering;
use crate::reachability::properties::check_properties;

mod coverability;
mod properties;

pub fn create_rg<'a>(
    marking: Vec<i16>,
    transition_inputs: Matrix,
    transition_outputs: Matrix,
) -> Result<RGResponse, String> {
    let start_time_rg = Instant::now();
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns

    let t_in: Array2<i16> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i16> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i16> = &t_out - &t_in;

    let state_vec = arr1(&marking);
    let mut queue: Vec<NodeIndex> = Vec::new();
    let mut graph = DiGraph::<Array1<i16>, i16>::new();
    let mut all_states_rev: HashMap<Array1<i16>, NodeIndex> = HashMap::new();

    // create & insert start node
    let start_node = graph.add_node(state_vec.clone());
    all_states_rev.insert(state_vec, start_node);
    queue.push(start_node);

    while !queue.is_empty() {
        let cur_state_idx = queue.pop().unwrap();
        let cur_state = graph.node_weight(cur_state_idx).cloned().unwrap();
        let active = find_active_transitions(&cur_state, &t_in);

        for inx in active {
            let new_state: Array1<i16> = fire_transition(&cur_state, &t_effect, inx as usize);
            match all_states_rev.get(&new_state) {
                None => {
                    let new_state_idx = graph.add_node(new_state.clone());
                    graph.add_edge(cur_state_idx, new_state_idx, inx);

                    all_states_rev.insert(new_state, new_state_idx);
                    queue.push(new_state_idx);
                    if is_covering(&new_state_idx, &graph, true) {
                        return Ok(RGResponse::unbounded());
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

    let start_time_properties = Instant::now();
    let properties = check_properties(&graph, *t);
    let end_time_properties = Instant::now();
    let elapsed_time_properties = end_time_properties - start_time_properties;

    println!(
        "Determining properties took {}ms ({:?})",
        elapsed_time_properties.as_millis(),
        properties
    );

    return Ok(RGResponse {
        states: graph.node_count(),
        edges: graph.edge_count(),
        reversible: properties.reversible,
        liveness: properties.liveness,
        bounded: true,
        message: format!("took {}ms", elapsed_time_properties.as_millis()).to_string(),
    });
}
