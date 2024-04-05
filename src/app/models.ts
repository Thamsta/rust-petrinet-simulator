export type SimulationResponse = {
	marking: number[],
	firings: number[],
    deadlocked: boolean,
}

export type RGResponse = {
	states: number,
    edges: number,
	reversible: boolean,
    liveness: boolean,
    bounded: number,
	bounded_vec: number[]
    dot_graph: string,
    message: string,
}
