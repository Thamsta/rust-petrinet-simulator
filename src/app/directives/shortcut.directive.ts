import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
	selector: '[appShortcut]'
})
export class ShortcutDirective {

	@Input('appShortcut') shortcut: string = '';

	key: string | undefined;
	ctrl: boolean = false;
	shift: boolean = false;
	alt: boolean = false;

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
		if (this.key == undefined) this.init();


		return event.key.toLowerCase() == this.key
			&& (event.ctrlKey || event.metaKey) == this.ctrl // meta key for macOS
			&& event.shiftKey == this.shift
			&& event.altKey == this.alt;
	}

	private init() {
		this.ctrl = this.shortcut.toLowerCase().startsWith("ctrl")
		this.shift = this.shortcut.toLowerCase().startsWith("shift")
		this.alt = this.shortcut.toLowerCase().startsWith("alt")
		this.key = this.shortcut.toLowerCase().substring(this.shortcut.length - 1)
	}
}
