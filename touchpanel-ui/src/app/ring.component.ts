import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
	selector: 'ring',
	template: `
		<ul class="menu">
			<li class="one">
				<a href="#">
					icon 1
				</a>
			</li>
			<li class="two">
				<a href="#">
					icon 2
				</a>
			</li>
		</ul>
	`,
	styles: ['./ring.component.scss']
})
export class RingComponent {
	@ViewChild('ring') ring: ElementRef;	

	constructor() {}

	convertToRadians() {
				
	}
}
