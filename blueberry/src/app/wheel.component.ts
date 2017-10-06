import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';

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
	titlearcpath: string;
	rightoffset: string;
	topoffset: string;

	@ViewChild("wheel") wheel: ElementRef;

	constructor() {}

	ngOnInit() {
		setTimeout(() => this.render(), 0);
	}

	private render() {
		let numOfChildren = this.display.inputs.length;	
		console.log("num of children", numOfChildren);
		let children = this.wheel.nativeElement.children;
		let angle = (360 - WheelComponent.TITLE_ANGLE) / numOfChildren;

		this.arcpath = WheelComponent.getArc(.5, .5, .5, 0, angle);
		this.titlearcpath = WheelComponent.getArc(.5, .5, .5, 0, WheelComponent.TITLE_ANGLE);

		let rotate = "rotate(" + String(-(WheelComponent.TITLE_ANGLE_ROTATE)) + "deg)";
		children[0].style.transform = rotate;
		children[0 + numOfChildren + 1].style.transform = rotate; //rotate the line the corrosponds to this slice

		for (let i = 1; i <= numOfChildren; ++i) {
			rotate = "rotate(" + String((angle * -i) - WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
			children[i].style.transform = rotate;
			children[i + numOfChildren + 1].style.transform = rotate; // rotate the line that corrosponds to this slice

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
			y: cy + (r * Math.sin(angleInRad))	
		}
	}
}
