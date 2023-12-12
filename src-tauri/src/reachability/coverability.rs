use ndarray::Array1;
use petgraph::Graph;
use petgraph::graph::NodeIndex;

pub(super) fn is_covering(new_node: &NodeIndex, graph: &Graph<Array1<i16>, i16>, pseudo: bool) -> bool {
    let new_node_weight = graph.node_weight(*new_node).unwrap();

    if pseudo {
        return new_node_weight.iter().any(|&a| a > 2048)
    }

    // TODO: do a backwards traversal instead
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
    let mut found_strictly_greater = false;
    let mut found_less = false;
    arr1.iter().zip(arr2.iter()).for_each(|(&a, &b)| {
        // check both so both arrays are only iterated once.
        if a < b { found_less = true; }
        if a > b { found_strictly_greater = true }
    });

    return !found_less && found_strictly_greater;
}
