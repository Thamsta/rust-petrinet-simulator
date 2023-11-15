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

export type SimulationResponse = {
	marking: number[],
	firings: number[],
}

export type RGResponse = {
	success: boolean,
}

export function isRunCommand(tool: DrawingTools): boolean {
	return Object.values([DrawingTools.RUN, DrawingTools.STEP, DrawingTools.STOP, DrawingTools.PAUSE]).includes(tool)
}
