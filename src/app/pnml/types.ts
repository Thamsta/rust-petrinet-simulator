class PnmlPosition {
    constructor(public $: { x: string; y: string }) {
    }
}

class PnmlDimension {
    constructor(public $: { x: string; y: string }) {
    }
}

class PnmlFill {
    constructor(public $: { color: string }) {
    }
}

class PnmlLine {
    constructor(public $: { color: string; style?: string }) {
    }
}

class PnmlOffset {
    constructor(public $: { x: string; y: string }) {
    }
}

class PnmlToolspecific {
    constructor(public $: { tool: string; version: string; uuid: string }) {
    }
}

class PnmlGraphics {
    constructor(
        public position?: PnmlPosition[],
        public dimension?: PnmlDimension[],
        public fill?: PnmlFill[],
        public line?: PnmlLine[],
        public offset?: PnmlOffset[]
    ) {
    }
}

class PnmlInscription {
    constructor(public graphics: PnmlGraphics[], public text: string[]) {
    }
}

class PnmlInitialMarking {
    constructor(public graphics: PnmlGraphics[], public text: string[]) {
    }
}

class PnmlPlace {
    constructor(
        public $: { id: string },
        public graphics: PnmlGraphics[],
        public toolspecific: PnmlToolspecific[],
        public initialMarking?: PnmlInitialMarking[]
    ) {
    }
}

class PnmlUpLink {
    constructor(public graphics: PnmlGraphics[], public text: string[]) {
    }
}

class PnmlDownLink {
    constructor(public graphics: PnmlGraphics[], public text: string[]) {
    }
}

class PnmlTransition {
    constructor(
        public $: { id: string },
        public graphics: PnmlGraphics[],
        public toolspecific: PnmlToolspecific[],
        public uplink?: PnmlUpLink[],
        public downlink?: PnmlDownLink[]
    ) {
    }
}

class PnmlArc {
    constructor(
        public $: { id: string; source: string; target: string },
        public graphics: PnmlGraphics[],
        public inscription: PnmlInscription[],
        public toolspecific: PnmlToolspecific[]
    ) {
    }
}

class PnmlNet {
    constructor(
        public $: { id: string; type: string },
        public name: { text: string[] }[],
        public place: PnmlPlace[],
        public transition: PnmlTransition[],
        public arc: PnmlArc[]
    ) {
    }
}

class Pnml {
    $: { xmlns: string };
    net: PnmlNet[];

    constructor($: { xmlns: string }, net: PnmlNet[]) {
        this.$ = $
        this.net = net
    }
}

export {
    Pnml,
    PnmlNet,
    PnmlPlace,
    PnmlTransition,
    PnmlArc,
    PnmlGraphics,
    PnmlInitialMarking,
    PnmlInscription,
    PnmlToolspecific,
    PnmlPosition,
    PnmlDownLink,
    PnmlFill,
    PnmlLine,
    PnmlOffset,
};
