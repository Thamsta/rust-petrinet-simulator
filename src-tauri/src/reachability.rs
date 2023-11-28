use std::collections::HashMap;
use std::time::Instant;

use ndarray::{arr1, Array1, Array2};
use petgraph::{Direction, Graph};
use petgraph::algo::tarjan_scc;
use petgraph::dot::Dot;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::visit::{EdgeRef, IntoNodeIdentifiers};

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

    let end_time = Instant::now();
    let elapsed_time = end_time - start_time;

    let total_states = graph.node_count();
    let total_edges = graph.edge_count();
    let elements_per_second = (total_states + total_edges) as f64 / elapsed_time.as_secs_f64() / 1000f64;

    println!("RG with {:?} states and {} edges took {}ms ({}k elem/s)", total_states, total_edges, elapsed_time.as_millis(), elements_per_second.round());

    let properties = check_properties(&graph, &start_node, *t);

    println!("Properties: {:?}", properties);

    return Ok(RGResponse::new(graph.node_count(), graph.edge_count(), properties.reversible, properties.liveness, true, "".to_string()));
}

fn check_properties(rg: &DiGraph<Array1<i32>, i32>, transitions: usize) -> RgProperties {
    let sccs = tarjan_scc(rg);
    let scc_graph = create_scc_graph(&sccs, rg);
    println!("{:?}", Dot::new(&scc_graph));

    let reversible = sccs.len() == 1 && rg.edge_count() > 0;
    let liveness = check_liveness(&scc_graph, transitions);

    return RgProperties { liveness, reversible };
}

fn check_liveness(scc_graph: &DiGraph<Vec<i32>, ()>, transitions: usize) -> bool {
    let mut liveness = true;
    scc_graph.node_identifiers().for_each(|inx| {
        let outgoing_edges = scc_graph.edges_directed(inx, Direction::Outgoing);
        if outgoing_edges.count() == 0 {
            // this is a terminal SCC
            let active_transitions = scc_graph.node_weight(inx).unwrap();
            if active_transitions.len() < transitions {
                liveness = false;
            }
        };
    });
    return liveness;
}

fn create_scc_graph(sccs: &Vec<Vec<NodeIndex>>, rg: &DiGraph<Array1<i32>, i32>) -> DiGraph<Vec<i32>, ()> {
    let mut graph = DiGraph::<Vec<i32>, ()>::new();
    let mut nodes = Vec::new(); // acts as a map from index to node

    // add SCC nodes upfront so that all nodes already exist.
    sccs.iter().for_each(| _ | {
        nodes.push(graph.add_node(Vec::new()))
    });

    for current_scc in 0..sccs.len() {
        let scc = sccs.get(current_scc).unwrap();
        let node = nodes.get(current_scc).unwrap();
        scc.iter().for_each(|idx| {
            rg.edges(*idx).for_each(|edge| {
                // for each edge starting from within the SCC:
                // if its target is
                let active_transitions: &mut Vec<i32> = graph.node_weight_mut(*node).unwrap();
                if scc.contains(&edge.target()) && !active_transitions.contains(&edge.weight()) {
                    // ... within the SCC, add the weight to active transitions
                    active_transitions.push(*edge.weight());
                } else {
                    // ... not within the SCC, add an edge from this SCC to the target's
                    let target_scc = get_scc_of_node(&edge.target(), sccs);
                    graph.add_edge(*nodes.get(current_scc).unwrap(), *nodes.get(target_scc).unwrap(), ());
                }
            });
        })
    };

    return graph;
}

fn get_scc_of_node(node: &NodeIndex, sccs: &Vec<Vec<NodeIndex>>) -> usize {
    for i in 0..sccs.len() {
        if sccs.get(i).unwrap().contains(node) {
            return i;
        }
    }

    panic!("Tried to find node index {:?} which is not in the SCC graph {:?}", node, sccs)
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
