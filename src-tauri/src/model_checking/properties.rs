use std::collections::{HashMap, HashSet};
use std::time::Instant;

use petgraph::algo::tarjan_scc;
use petgraph::Direction;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::visit::IntoNodeIdentifiers;

use crate::common::{ReachabilityGraph, RGProperties, RGResult};

pub(super) fn check_properties(result: &RGResult, transitions: usize) -> RGProperties {
    let bounded_vector = get_bounded_vector(&result.rg);
    let k_bounded = bounded_vector.clone().into_iter().max().unwrap();
    if result.has_deadlocks {
        println!("Deadlock occurred during RG generation. Skip checking properties");
        return RGProperties {
            liveness: false,
            reversible: false,
            bounded_vec: bounded_vector,
            k_bounded: k_bounded,
            has_deadlock: result.has_deadlocks,
        };
    }

    let start_time_properties = Instant::now();
    let rg = &result.rg;
    let sccs = tarjan_scc(&rg);
    let scc_graph = create_scc_graph(&sccs, &rg, transitions);
    let end_time_properties = Instant::now();
    let elapsed_time_properties = end_time_properties - start_time_properties;
    println!(
        "Creating SCC-Graph with {} states and {} edges took {}ms",
        scc_graph.node_count(),
        scc_graph.edge_count(),
        elapsed_time_properties.as_millis()
    );

    let reversible = sccs.len() == 1 && rg.edge_count() > 0;
    let liveness = check_liveness(&scc_graph);

    return RGProperties {
        liveness,
        reversible,
        bounded_vec: bounded_vector,
        k_bounded: k_bounded,
        has_deadlock: result.has_deadlocks,
    };
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

fn get_bounded_vector(rg: &ReachabilityGraph) -> Vec<i16> {
    let length = rg.node_weight(NodeIndex::new(0)).unwrap().len();
    let mut max_values = vec![-1; length];

    for weight in rg.node_weights() {
        max_values = max_values
            .iter()
            .zip(weight.iter())
            .map(|(&x, &y)| x.max(y))
            .collect();
    }

    return max_values;
}

// TODO: compare with petgraph::algo::condensation implementation
fn create_scc_graph(
    sccs: &Vec<Vec<NodeIndex>>,
    rg: &ReachabilityGraph,
    transitions: usize,
) -> DiGraph<bool, ()> {
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
    let mut scc_transitions: HashMap<usize, HashSet<i16>> = HashMap::new();

    for edge in rg.edge_indices() {
        let (source, target) = rg.edge_endpoints(edge).unwrap();
        let source_scc = node_to_scc[source.index()];
        let target_scc = node_to_scc[target.index()];
        if source_scc != target_scc && unique_edges.insert((source_scc, target_scc)) {
            graph.add_edge(NodeIndex::new(source_scc), NodeIndex::new(target_scc), ());
        } else if source_scc == target_scc {
            let entry = scc_transitions
                .entry(source_scc)
                .or_insert_with(HashSet::new);
            entry.insert(*rg.edge_weight(edge).unwrap());
        }
    }

    // Label nodes based on the presence of internal edges with each label
    for (_, node) in graph.node_indices().enumerate() {
        match scc_transitions.get(&(node.index())) {
            Some(labels) => {
                graph[node] = labels.len() == transitions;
            }
            None => {}
        }
    }

    return graph;
}
