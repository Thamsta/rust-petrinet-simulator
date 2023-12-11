use ndarray::Array1;
use petgraph::Graph;
use petgraph::graph::NodeIndex;

pub(super) fn is_covering(new_node: &NodeIndex, graph: &Graph<Array1<i16>, i16>, pseudo: bool) -> bool {
    // TODO: check only if transition produces more tokens than it consumes
    // TODO: do a backwards traversal instead
    let new_node_weight = graph.node_weight(*new_node).unwrap();

    if pseudo {
        return new_node_weight.iter().any(|&a| a > 2048)
    }

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

fn is_strictly_greater_than(arr1: &Array1<i16>, arr2: &Array1<i16>) -> bool {
    let is_greater_than =  arr1.iter().zip(arr2.iter()).all(|(&a, &b)| a >= b) &&
        arr1.iter().zip(arr2.iter()).any(|(&a, &b)| a > b);

    // println!("{} > {}: {}", arr1, arr2, is_greater_than);

    return is_greater_than;
}
