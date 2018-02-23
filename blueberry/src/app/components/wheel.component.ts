import { Component, Input as AngularInput, Output as AngularOutput, AfterContentInit, ElementRef, ViewChild, EventEmitter } from '@angular/core';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { SwalComponent, SwalPartialTargets } from '@toverux/ngx-sweetalert2';

import { Preset, AudioConfig } from '../objects/objects';
import { Display, Input, AudioDevice } from '../objects/status.objects';
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
    @AngularInput() top: string;
    @AngularInput() right: string;
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

	constructor(public command: CommandService, private api: APIService, public readonly swalTargets: SwalPartialTargets) {}

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
        let offsetX: number = parseInt(this.right);
        let offsetY: number = parseInt(this.top);

        let x = 50 - offsetX;
        let y = 50 - offsetY;

        this.translate = String("translate("+x+"vw,"+y+"vh)");
    }

	private setInputOffset() {
		let top: number;
		let right: number;

		switch (this.preset.inputs.length + this.preset.extraInputs.length) {
			case 7:
				top = -0.6;
				right = 25.4;
				break;
			case 6:
				top = 0.8;
				right = 24;
				break;
			case 5:
				top = 2;
				right = 20.4;
				break;
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
				top = 63;
				right = 7;
				break;	
			default:
                console.warn("no configuration for", this.preset.inputs.length + this.preset.extraInputs.length, "displays");
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

    public share(displays: Display[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.command.share(this.preset.displays[0], displays).subscribe(
            success => {
                if (success) {
                    ret.emit(true);
                } else {
                    ret.emit(false);
                }
            }
        );

        return ret;
    }

    public unShare(from: Display[], fromAudio: AudioConfig[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.command.unShare(from, fromAudio).subscribe(
            success => {
                if (success) {
                    ret.emit(true);
                } else {
                    ret.emit(false); 
                }
            }
        ); 

        return ret;
    }
}
