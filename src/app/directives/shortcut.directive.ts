import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
	selector: '[appShortcut]'
})
export class ShortcutDirective {

	@Input('appShortcut') shortcut: string = '';

	constructor(private element: ElementRef) {
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent): void {
		if (this.shortcutMatches(event)) {
			event.preventDefault(); // Prevents default browser behavior
			// Perform the action associated with the shortcut
			this.element.nativeElement.click();
		}
	}

	private shortcutMatches(event: KeyboardEvent): boolean {
		return event.key.toLowerCase() == this.shortcut.toLowerCase();
	}
}
