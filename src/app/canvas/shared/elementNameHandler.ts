export class ElementNameHandler {
    place = 0
    transition = 0

    getNextPlaceName(): string {
        this.place++
        return "p" + this.place
    }

    getNextTransitionName(): string {
        this.transition++
        return "t" + this.transition
    }
}