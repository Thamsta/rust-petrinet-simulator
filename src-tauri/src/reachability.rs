use std::collections::HashMap;
use std::time::Instant;

use ndarray::{arr1, Array1, Array2};
use petgraph::Graph;
use petgraph::graph::{DiGraph, NodeIndex};

use crate::common::*;
use crate::reachability::properties::check_properties;

mod properties;

pub fn create_rg<'a>(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>) -> Result<RGResponse, String> {
    let start_time_rg = Instant::now();
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns

    let t_in: Array2<i32> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i32> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i32> = &t_out - &t_in;

    let state_vec = arr1(&marking);
    let mut queue: Vec<NodeIndex> = Vec::new();
    let mut graph = DiGraph::<Array1<i32>, i32>::new();
    let mut all_states_rev: HashMap<Array1<i32>, NodeIndex> = HashMap::new();

    let mut step_counter = 0;

    // create & insert start node
    let start_node = graph.add_node(state_vec.clone());
    all_states_rev.insert(state_vec, start_node);
    queue.push(start_node);

    while !queue.is_empty() {
        if step_counter > 50000 {
            println!("Aborting after {} steps.", step_counter - 1);
            return Err("RG is unbounded or too large!".to_string());
        }
        let cur_state_idx = queue.pop().unwrap();
        let cur_state = graph.node_weight(cur_state_idx).cloned().unwrap();
        let active = find_active_transitions(&cur_state, &t_in);

        let mut has_covering = false;
        active.iter()
            .for_each(|&inx| {
                let new_state: Array1<i32> = fire_transition(&cur_state, &t_effect, inx as usize);
                has_covering = has_covering || match insert_next_state(cur_state_idx, new_state, &mut all_states_rev, &mut graph, inx, &mut queue) {
                    None => { false }
                    Some(new_node_index) => { is_covering(&new_node_index, &graph) }
                };
            });
        // TODO: return a positive response instead
        if has_covering { return Err("Graph is unbounded".to_string()); }
        step_counter += 1;
    }

    let end_time_rg = Instant::now();
    let elapsed_time_rg = end_time_rg - start_time_rg;

    let total_states = graph.node_count();
    let total_edges = graph.edge_count();
    let elements_per_second = (total_states + total_edges) as f64 / elapsed_time_rg.as_secs_f64() / 1000f64;

    println!("RG with {:?} states and {} edges took {}ms ({}k elem/s)", total_states, total_edges, elapsed_time_rg.as_millis(), elements_per_second.round());

    let start_time_properties = Instant::now();
    let properties = check_properties(&graph, *t);
    let end_time_properties = Instant::now();
    let elapsed_time_properties = end_time_properties - start_time_properties;

    println!("Determining properties took {}ms ({:?})", elapsed_time_properties.as_millis(), properties);

    return Ok(RGResponse::new(graph.node_count(), graph.edge_count(), properties.reversible, properties.liveness, true, "".to_string()));
}

fn is_covering(new_node: &NodeIndex, graph: &Graph<Array1<i32>, i32>) -> bool {
    // TODO: check only if transition produces more tokens than it consumes
    // TODO: do a backwards traversal instead
    let new_node_weight = graph.node_weight(*new_node).unwrap();
    for node in graph.node_indices() {
        let weight_of_node = graph.node_weight(node).unwrap();
        if graph.contains_edge(node, *new_node) {
            if is_strictly_greater_than(new_node_weight, weight_of_node) {
                return true;
            }
        } else {
            // Check if there is a path from 'node' to 'new_node'
            if petgraph::algo::has_path_connecting(&graph, node, *new_node, None) {
                if is_strictly_greater_than(new_node_weight, weight_of_node) {
                    return true;
                }
            }
        }
    }

    return false
}

fn is_strictly_greater_than(arr1: &Array1<i32>, arr2: &Array1<i32>) -> bool {
    let is_greater_than =  arr1.iter().zip(arr2.iter()).all(|(&a, &b)| a >= b) &&
        arr1.iter().zip(arr2.iter()).any(|(&a, &b)| a > b);

    // println!("{} > {}: {}", arr1, arr2, is_greater_than);

    return is_greater_than;
}

fn insert_next_state(old_state_idx: NodeIndex, new_state: Array1<i32>, all_states_rev: &mut HashMap<Array1<i32>, NodeIndex>, graph: &mut Graph<Array1<i32>, i32>, inx: i32, queue: &mut Vec<NodeIndex>) -> Option<NodeIndex> {
    let existing = all_states_rev.get(&new_state);
    return match existing {
        None => {
            let new_state_idx = graph.add_node(new_state.clone());
            all_states_rev.insert(new_state, new_state_idx);
            queue.push(new_state_idx);
            graph.add_edge(old_state_idx, new_state_idx, inx);
            Some(new_state_idx)
        }
        Some(actual) => {
            graph.add_edge(old_state_idx, actual.clone(), inx);
            None
        }
    }
}
