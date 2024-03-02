use std::time::Instant;
use ndarray::{ArrayBase, Dim, OwnedRepr};

use petgraph::dot::{Config, Dot};
use petgraph::graph::{EdgeReference, NodeIndex};

use crate::common::*;

mod coverability;
mod properties;
mod reachability;

pub fn check_properties(
    marking: InputState,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
) -> Result<RGResponse, String> {
    let t = transition_inputs.len();
    let start_time_rg = Instant::now();
    let rg_result = reachability::create_rg(marking, transition_inputs, transition_outputs);
    let end_time_rg = Instant::now();

    return match rg_result {
        Ok(result) => {
            let rg = &result.rg;

            let start_time_properties = Instant::now();
            let rg_properties = properties::check_properties(&result, t);
            let end_time_properties = Instant::now();

            let total = end_time_properties - start_time_rg;
            let total_rg = end_time_rg - start_time_rg;
            let total_properties = end_time_properties - start_time_properties;

            let edge_extractor =
                |_: &ReachabilityGraph, er: EdgeReference<i16>| -> String { return format!("label = \"t{}\"", er.weight()) };
            let node_extractor =
                |_: &ReachabilityGraph, state: (NodeIndex<u32>, &ArrayBase<OwnedRepr<i16>, Dim<[usize; 1]>>)| -> String { return format!("label = \"{:?}\"", state.1.to_vec()) };
            let dot_graph = format!(
                "{:?}",
                Dot::with_attr_getters(
                    rg,
                    &[Config::EdgeNoLabel, Config::NodeNoLabel],
                    &edge_extractor,
                    &node_extractor
                )
            );

            let time_string = format!(
                "Total: {}ms, RG {}ms, Properties {}ms",
                total.as_millis(),
                total_rg.as_millis(),
                total_properties.as_millis()
            );

            println!("--- #### ---");
            println!("---💢 RG ---");
            println!("{} nodes", rg.node_count());
            println!("{} edges", rg.edge_count());
            println!("---⏳ Time---");
            println!("{}ms total", total.as_millis());
            println!("  {}ms RG", total_rg.as_millis());
            println!("  {}ms properties", total_properties.as_millis());
            println!("--- --- ---");
            return Ok(RGResponse::success(&rg, &rg_properties, dot_graph, time_string));
        }
        Err(_) => Ok(RGResponse::unbounded()),
    };
}
