use std::collections::{HashMap, HashSet};
use std::time::Instant;

use ndarray::{arr1, Array1, Array2};
use petgraph::{Direction, Graph};
use petgraph::algo::tarjan_scc;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::visit::IntoNodeIdentifiers;

use crate::common::*;

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
    all_states_rev.insert(state_vec.clone(), start_node);
    queue.push(start_node);

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
                insert_next_state(cur_state_idx, new_state, &mut all_states_rev, &mut graph, inx, &mut queue);
            });
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

fn check_properties(rg: &DiGraph<Array1<i32>, i32>, transitions: usize) -> RgProperties {
    let sccs = tarjan_scc(rg);
    let start_time_properties = Instant::now();
    let scc_graph = create_scc_graph(&sccs, rg, transitions);
    let end_time_properties = Instant::now();
    let elapsed_time_properties = end_time_properties - start_time_properties;
    println!("SCC-Graph with {} states and {} edges took {}ms", scc_graph.node_count(), scc_graph.edge_count(), elapsed_time_properties.as_millis());


    let reversible = sccs.len() == 1 && rg.edge_count() > 0;
    let liveness = check_liveness(&scc_graph);

    return RgProperties { liveness, reversible };
}

fn check_liveness(scc_graph: &DiGraph<bool, ()>) -> bool {
    let mut liveness = true;
    scc_graph.node_identifiers().for_each(|inx| {
        let outgoing_edges = scc_graph.edges_directed(inx, Direction::Outgoing);
        if outgoing_edges.count() == 0 {
            // this is a terminal SCC, check if it is labeled with true
            if !scc_graph.node_weight(inx).unwrap() {
                liveness = false;
            }
        };
    });
    return liveness;
}

fn create_scc_graph(sccs: &Vec<Vec<NodeIndex>>, rg: &DiGraph<Array1<i32>, i32>, transitions: usize) -> DiGraph<bool, ()> {
    let mut graph = DiGraph::<bool, ()>::new();
    let mut node_to_scc: Vec<usize> = vec![0; rg.node_count()];

    for (scc_index, scc) in sccs.iter().enumerate() {
        for &node_index in scc {
            node_to_scc[node_index.index()] = scc_index;
        }
    }

    for _ in 0..sccs.len() {
        graph.add_node(false);
    }

    // HashSet to store unique edges
    let mut unique_edges: HashSet<(usize, usize)> = HashSet::new();
    let mut scc_transitions: HashMap<usize, HashSet<i32>> = HashMap::new();

    for edge in rg.edge_indices() {
        let (source, target) = rg.edge_endpoints(edge).unwrap();
        let source_scc = node_to_scc[source.index()];
        let target_scc = node_to_scc[target.index()];
        if source_scc != target_scc && unique_edges.insert((source_scc, target_scc)) {
            graph.add_edge(NodeIndex::new(source_scc), NodeIndex::new(target_scc), ());
        } else if source_scc == target_scc {
            let entry = scc_transitions.entry(source_scc).or_insert_with(HashSet::new);
            entry.insert(rg.edge_weight(edge).unwrap().clone());
        }
    }

    // Label nodes based on the presence of internal edges with each label
    for (_, node) in graph.node_indices().enumerate() {
        match scc_transitions.get(&(node.index())) {
            Some(labels) => { graph[node] = labels.len() == transitions; }
            None => {}
        }
    }

    return graph;
}

fn insert_next_state(old_state_idx: NodeIndex, new_state: Array1<i32>, all_states_rev: &mut HashMap<Array1<i32>, NodeIndex>, graph: &mut Graph<Array1<i32>, i32>, inx: i32, queue: &mut Vec<NodeIndex>) -> Option<NodeIndex> {
    let existing = all_states_rev.get(&new_state);
    match existing {
        None => {
            let new_state_idx = graph.add_node(new_state.clone());
            all_states_rev.insert(new_state.clone(), new_state_idx);
            queue.push(new_state_idx);
            graph.add_edge(old_state_idx, new_state_idx, inx);
        }
        Some(actual) => {
            graph.add_edge(old_state_idx, actual.clone(), inx);
            return Some(actual.clone());
        }
    }
    return None;
}

#[derive(Debug)]
struct RgProperties {
    liveness: bool,
    reversible: bool,
}
