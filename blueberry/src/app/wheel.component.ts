import { Component, Input, OnInit, ElementRef } from '@angular/core';

import { OutputDevice } from './objects';

@Component({
	selector: 'wheel',
	templateUrl: './wheel.component.html',
	styleUrls: ['./wheel.component.scss'],
})

export class WheelComponent implements OnInit {
	private static TITLE_ANGLE: number =  100;
	private static TITLE_ANGLE_ROTATE: number = WheelComponent.TITLE_ANGLE / 2;

	@Input() display: OutputDevice; 

	arcpath: string;
	titleArcPath: string;
	rightoffset: string;
	topoffset: string;

	constructor(private element: ElementRef) {}

	ngOnInit() {
		this.render();
	}

	private render() {
		let numOfChildren = this.element.nativeElement.childElementCount;	
		let children = this.element.nativeElement.children;
		let angle = (360 - WheelComponent.TITLE_ANGLE) / (numOfChildren - 1);

		this.arcpath = WheelComponent.getArc(.5, .5, .5, 0, angle);
		this.titleArcPath = WheelComponent.getArc(.5, .5, .5, 0, WheelComponent.TITLE_ANGLE);

		let rotate = "rotate(" + String(-(WheelComponent.TITLE_ANGLE_ROTATE)) + "deg)";
		children[0].style.transform = rotate;

		for (let i = 1; i < numOfChildren; ++i) {
			rotate = "rotate(" + String((angle * -i) - WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
			children[i].style.transform = rotate;

			rotate = "rotate(" + String((angle * i) + WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
			children[i].firstElementChild.style.transform = rotate;
		}

		this.getInputOffset();
	}

	private getInputOffset() {
		let top: number;
		let right: number;

		switch (this.display.inputs.length) {
			case 4:
				top = 9;
				right = 22.5;
				break;
			case 3: 
				top = 13;
				right = 16;
				break;
			case 2:
				top = 26;
				right = 10;
				break;
			case 1:
				top = 64;
				right = 15;
				break;	
			default:
				break;
		}

		this.topoffset = String(top) + "%";
		this.rightoffset = String(right) + "%";
	}

	private static getArc(x, y, radius, startAngle, endAngle): string {
		let start = WheelComponent.polarToCart(x, y, radius, endAngle);
		let end = WheelComponent.polarToCart(x, y, radius, startAngle);

		let largeArc = endAngle - startAngle <= 180 ? "0" : "1";

		let d = [
			"M", start.x, start.y,
			"A", radius, radius, 0, largeArc, 0, end.x, end.y,
			"L", x, y,
			"L", start.x, start.y
		].join(" ");

		return d;
	}

	private static polarToCart(cx, cy, r, angle) {
		let angleInRad = (angle - 90) * Math.PI / 180.0;

		return {
			x: cx + (r * Math.cos(angleInRad)),
			y: cy + (r * Math.cos(angleInRad))	
		}
	}
}
