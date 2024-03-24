export enum DrawingTools {
	SELECT = 'SELECT',
	GARBAGE = 'GARBAGE',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TOKEN_INC = 'TOKEN_INC',
	TOKEN_DEC = 'TOKEN_DEC',
	RUN = 'RUN',
	STEP = 'STEP',
	STOP = 'STOP',
	PAUSE = 'PAUSE',
	RG = 'RG',
}

export function isPlayerCommand(tool: DrawingTools): boolean {
	return Object.values([DrawingTools.RUN, DrawingTools.STEP, DrawingTools.STOP, DrawingTools.PAUSE]).includes(tool)
}

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
