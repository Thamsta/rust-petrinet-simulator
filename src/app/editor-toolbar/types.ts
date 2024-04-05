export enum DrawingTools {
    SELECT,
    GARBAGE,
    TRANSITION,
    PLACE,
    ARC,
    TOKEN_INC,
    TOKEN_DEC,
    RUN,
    STEP,
    STOP,
    PAUSE,
    NAME,
    RG,
}

export function isPlayerCommand(tool: DrawingTools): boolean {
    return Object.values([DrawingTools.RUN, DrawingTools.STEP, DrawingTools.STOP, DrawingTools.PAUSE]).includes(tool)
}