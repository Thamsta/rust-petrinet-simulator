use std::time::Instant;

use crate::common::*;

mod coverability;
mod properties;
mod reachability;

pub fn check_properties(
    marking: Vec<i16>,
    transition_inputs: InputMatrix,
    transition_outputs: InputMatrix,
) -> Result<RGResponse, String> {
    let t = transition_inputs.len();
    let start_time_rg = Instant::now();
    let rg_result = reachability::create_rg(marking, transition_inputs, transition_outputs);
    let end_time_rg = Instant::now();

    return match rg_result {
        Ok(graph) => {
            let start_time_properties = Instant::now();
            let rg_properties = properties::check_properties(&graph, t);
            let end_time_properties = Instant::now();

            let total = end_time_properties - start_time_rg;
            let total_rg = end_time_rg - start_time_rg;
            let total_properties = end_time_properties - start_time_properties;

            let time_string = format!(
                "Total: {}ms, RG {}ms, Properties {}",
                total.as_millis(),
                total_rg.as_millis(),
                total_properties.as_millis()
            );
            println!("{}", time_string);
            return Ok(RGResponse::success(&graph, &rg_properties, time_string));
        }
        Err(_) => Ok(RGResponse::unbounded()),
    };
}
