export enum DrawingTools {
    SELECT,
    GARBAGE,
    TRANSITION,
    PLACE,
    ARC,
    TOKEN_INC,
    TOKEN_INC_5,
    TOKEN_DEC,
    TOKEN_DEC_5,
    RUN,
    STEP,
    STOP,
    PAUSE,
    NAME,
    RG,
}

export function getDecIncValue(tool: DrawingTools): number {
    switch (tool) {
        case DrawingTools.TOKEN_INC:
            return 1
        case DrawingTools.TOKEN_INC_5:
            return 5
        case DrawingTools.TOKEN_DEC:
            return -1
        case DrawingTools.TOKEN_DEC_5:
            return -5
    }
    
    return 0
}

export function isPlayerCommand(tool: DrawingTools): boolean {
    return Object.values([DrawingTools.RUN, DrawingTools.STEP, DrawingTools.STOP, DrawingTools.PAUSE]).includes(tool)
}