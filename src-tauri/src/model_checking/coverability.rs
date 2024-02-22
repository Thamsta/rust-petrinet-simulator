use petgraph::graph::NodeIndex;
use petgraph::Direction;
use std::collections::HashSet;

use crate::common::{ReachabilityGraph, State};

pub(super) fn is_covering(new_node: &NodeIndex, graph: &ReachabilityGraph, pseudo: bool) -> bool {
    let new_node_weight = graph.node_weight(*new_node).unwrap();

    if pseudo {
        return new_node_weight.iter().any(|&a| a > 2048);
    }

    let mut visited = HashSet::new();
    let mut stack = vec![*new_node];
    while let Some(node) = stack.pop() {
        if !visited.insert(node) {
            continue;
        }

        let weight_of_node = graph.node_weight(node).unwrap();
        if is_strictly_greater_than(new_node_weight, weight_of_node) {
            return true;
        }

        let predecessors = graph.neighbors_directed(node, Direction::Incoming);
        for predecessor in predecessors {
            stack.push(predecessor)
        }
    }

    return false;
}

fn is_strictly_greater_than(arr1: &State, arr2: &State) -> bool {
    let mut found_strictly_greater = false;
    let mut found_less = false;
    arr1.iter().zip(arr2.iter()).for_each(|(&a, &b)| {
        // check both so both arrays are only iterated once.
        if a < b {
            found_less = true;
        }
        if a > b {
            found_strictly_greater = true
        }
    });

    return !found_less && found_strictly_greater;
}
