import { Component, Input as AngularInput, Output as AngularOutput, AfterContentInit, ElementRef, ViewChild, EventEmitter } from '@angular/core';

import { Preset } from '../objects/objects';
import { Display, Input, AudioDevice, DTA } from '../objects/status.objects';
import { CommandService } from '../services/command.service';
import { Event } from '../services/socket.service';
import { APIService } from '../services/api.service';

@Component({
	selector: 'wheel',
	templateUrl: './wheel.component.html',
	styleUrls: ['./wheel.component.scss', '../colorscheme.scss'],
})

export class WheelComponent implements AfterContentInit {
	private static TITLE_ANGLE: number =  100;
	private static TITLE_ANGLE_ROTATE: number = WheelComponent.TITLE_ANGLE / 2;

	@AngularInput() preset: Preset; 
    @AngularInput() blur: boolean;
    @AngularInput() openControlledByPower: boolean;
    @AngularOutput() init: EventEmitter<any> = new EventEmitter();

	arcpath: string;
	titlearcpath: string;
	rightoffset: string;
	topoffset: string;
    translate: string;
	circleOpen: boolean = false;
    thumbLabel: boolean = true;

	@ViewChild("wheel") wheel: ElementRef;

	constructor(public command: CommandService, private api: APIService) {}

	ngAfterContentInit() {
		setTimeout(() => {
            this.render(); 
            this.init.emit(true)
            if (this.openControlledByPower) {
                setInterval(() => {
                    this.circleOpen = this.getPower() == "on";
                }, 1000);
           }
        }, 0);
	}

	public toggle() {
        if (this.circleOpen) {
            this.close();
        } else {
            this.open(true, 0);
        }
	}

    public open(togglePower: boolean, delay: number) {
        if (togglePower && this.getPower() != "on")
            this.command.setPower('on', this.preset.displays);

        setTimeout(() => {
            this.circleOpen = true;
        }, delay);
    }

    public close() {
        this.circleOpen = false;
    }
	
	public render() {
        this.setTranslate();

		let numOfChildren = this.preset.inputs.length + this.preset.extraInputs.length;	
		let children = this.wheel.nativeElement.children;
		let angle = (360 - WheelComponent.TITLE_ANGLE) / numOfChildren;

		this.arcpath = WheelComponent.getArc(.5, .5, .5, 0, angle);
		this.titlearcpath = WheelComponent.getArc(.5, .5, .5, 0, WheelComponent.TITLE_ANGLE);

		let rotate = "rotate(" + String(-(WheelComponent.TITLE_ANGLE_ROTATE)) + "deg)";
		children[0].style.transform = rotate;
		children[0 + numOfChildren + 1].style.transform = rotate; //rotate the line the corrosponds to this slice
	    rotate = "rotate(" + String(WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
        children[0].firstElementChild.style.transform = rotate;

		for (let i = 1; i <= numOfChildren; ++i) {
			rotate = "rotate(" + String((angle * -i) - WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
			children[i].style.transform = rotate;
			children[i + numOfChildren + 1].style.transform = rotate; // rotate the line that corrosponds to this slice

			rotate = "rotate(" + String((angle * i) + WheelComponent.TITLE_ANGLE_ROTATE) + "deg)";
			children[i].firstElementChild.style.transform = rotate;
		}

		this.setInputOffset();
	}

    private setTranslate() {
        let offsetX: number = parseInt(this.preset.right);
        let offsetY: number = parseInt(this.preset.top);

        let x = 50 - offsetX;
        let y = 50 - offsetY;

        this.translate = String("translate("+x+"vw,"+y+"vh)");
    }

	private setInputOffset() {
		let top: number;
		let right: number;

		switch (this.preset.inputs.length + this.preset.extraInputs.length) {
			case 4:
				top = 4;
				right = 17.5;
				break;
			case 3: 
				top = 9;
				right = 12;
				break;
			case 2:
				top = 20;
				right = 2;
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

    public closeThumb() {
        setTimeout(() => {
            document.getElementById('slider').blur();
        }, 750);
    }

    getInput(): Input {
        return Display.getInput(this.preset.displays);
    }

    getBlank(): boolean {
        return Display.getBlank(this.preset.displays); 
    }

    getPower(): string {
        return Display.getPower(this.preset.displays); 
    }

    getVolume(): number {
        return AudioDevice.getVolume(this.preset.audioDevices); 
    }

    getMute(): boolean {
        return AudioDevice.getMute(this.preset.audioDevices); 
    }

    public displayToAll(input: Input, displays: Display[], audioDevices: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.command.displayToAll(input, displays, audioDevices).subscribe(
            success => {
                if (success) {
                    ret.emit(true);
                    let event: Event = new Event(0, 0, APIService.piHostname, "", DTA, "true");
                    this.api.sendFeatureEvent(event);
                } else {
                    ret.emit(false);
                }
            }
        );

        return ret;
    }

    public unDisplayToAll(presets: Preset[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.command.unDisplayToAll(presets).subscribe(
            success => {
                if (success) {
                    ret.emit(true);
                    let event: Event = new Event(0, 0, APIService.piHostname, "", DTA, "false");
                    this.api.sendFeatureEvent(event);
                } else {
                    ret.emit(false); 
                }
            }
        ); 

        return ret;
    }
}
