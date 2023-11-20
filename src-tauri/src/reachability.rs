use std::collections::HashMap;
use std::time::Instant;

use ndarray::{arr1, Array1, Array2};
use petgraph::algo::tarjan_scc;
use petgraph::Graph;
use petgraph::graph::{DiGraph, NodeIndex};

use crate::common::*;

pub fn create_rg<'a>(marking: Vec<i32>, transition_inputs: Vec<Vec<i32>>, transition_outputs: Vec<Vec<i32>>) -> Result<RGResponse, String> {
    let start_time = Instant::now();
    let t = &transition_inputs.len(); // rows
    let p = &transition_inputs.get(0).expect("empty array").len(); // columns

    let t_in: Array2<i32> = vec_vec_to_array2(&transition_inputs, &t, &p);
    let t_out: Array2<i32> = vec_vec_to_array2(&transition_outputs, &t, &p);
    let t_effect: Array2<i32> = &t_out - &t_in;

    let state_vec = arr1(&marking);
    let mut queue: Vec<NodeIndex> = Vec::new();
    let mut graph = DiGraph::<Array1<i32>, ()>::new();
    let mut all_states_rev: HashMap<Array1<i32>, NodeIndex> = HashMap::new();

    let mut step_counter = 0;

    // create & insert start node
    let nd = graph.add_node(state_vec.clone());
    all_states_rev.insert(state_vec.clone(), nd);
    queue.push(nd);

    while !queue.is_empty() {
        if step_counter > 50000 {
            println!("Aborting after {} steps.", step_counter - 1);
            return Err("RG is unbounded or too large!".to_string());
        }
        let cur_state_idx = queue.pop().unwrap();
        let cur_state = graph.node_weight(cur_state_idx).cloned().unwrap();
        let active = find_active_transitions(&cur_state, &t_in);

        active.iter()
            .for_each(|&inx| {
                let new_state: Array1<i32> = fire_transition(&cur_state, &t_effect, inx as usize);
                insert_next_state(cur_state_idx, new_state, &mut all_states_rev, &mut graph, &mut queue);
            });
        step_counter += 1;
    }

    let end_time = Instant::now();
    let elapsed_time = end_time - start_time;

    let total_states = graph.node_count();
    let total_edges = graph.edge_count();
    let elements_per_second = (total_states + total_edges) as f64 / elapsed_time.as_secs_f64() / 1000f64;

    println!("RG with {:?} states and {} edges took {}ms ({}k elem/s)", total_states, total_edges, elapsed_time.as_millis(), elements_per_second.round());

    let reversible = check_properties(&graph);

    return Ok(RGResponse::new(graph.node_count(), graph.edge_count(), reversible))
}

pub fn check_properties(rg: &DiGraph<Array1<i32>, ()>) -> bool {
    let sccs = tarjan_scc(rg);

    return sccs.len() == 1 && rg.edge_count() > 0;
}

fn insert_next_state(old_state_idx: NodeIndex, new_state: Array1<i32>, all_states_rev: &mut HashMap<Array1<i32>, NodeIndex>, graph: &mut Graph<Array1<i32>, ()>, queue: &mut Vec<NodeIndex>) -> Option<NodeIndex> {
    let existing = all_states_rev.get(&new_state);
    match existing {
        None => {
            let new_state_idx = graph.add_node(new_state.clone());
            all_states_rev.insert(new_state.clone(), new_state_idx);
            queue.push(new_state_idx);
            graph.add_edge(old_state_idx, new_state_idx, ());
        }
        Some(actual) => {
            graph.add_edge(old_state_idx, actual.clone(), ());
            return Some(actual.clone());
        }
    }
    return None;
}
