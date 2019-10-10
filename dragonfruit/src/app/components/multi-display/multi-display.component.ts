import { Component, OnInit, Input as AngularInput } from '@angular/core';
import { ControlGroup, Display, Input, IconPair } from 'src/app/objects/control';
import { BFFService } from 'src/app/services/bff.service';
import { IControlTab } from '../control-tab/icontrol-tab';

class Page {
  pageOption: string;
  weight: number;
  displays: Display[];

  constructor() {
    this.displays = [];
    this.weight = 0;
    this.pageOption = '';
  }
}

@Component({
  selector: 'app-multi-display',
  templateUrl: './multi-display.component.html',
  styleUrls: ['./multi-display.component.scss']
})
export class MultiDisplayComponent implements OnInit, IControlTab {
  @AngularInput() cg: ControlGroup;
  selectedDisplay: Display;
  displayPages: Page[];

  constructor(
    private bff: BFFService
  ) {
    this.displayPages = [];
  }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.cg !== undefined) {
      this.generatePages();
    }
  }

  getInputInfo(inputID: string): IconPair {
    const i = this.cg.inputs.find((x) => {
      return x.id.includes(inputID);
    });

    const pair = {
      name: i.name,
      icon: i.icon
    };

    return pair;
  }

  generatePages() {
    console.log(this.cg);
    if (this.cg === undefined || this.cg.displays === undefined) {
      console.log('uninitialized control group');
      return;
    }
    let dispIndex = 0;

    let p = new Page();
    p.displays = [];

    while (dispIndex < this.cg.displays.length) {
      if (p.weight > 0 && (p.weight + this.cg.displays[dispIndex].outputs.length >= 5)) {
        this.displayPages.push(p);
        p = new Page();
      }

      // set the length of the outputs to the weight of the page
      p.weight += this.cg.displays[dispIndex].outputs.length;
      p.displays.push(this.cg.displays[dispIndex]);
      if (p.weight > 4) {
        p.pageOption = '4';
      } else {
        p.pageOption += '' + (this.cg.displays[dispIndex].outputs.length);
      }

      // check to see if the weight is less than the max
      if (p.weight >= 4) {
        // assign the page and move on to the next one
        this.displayPages.push(p);
        p = new Page();
      } else {
        if (dispIndex === this.cg.displays.length - 1) {
          this.displayPages.push(p);
        }
      }

      dispIndex++;
    }

    console.log(this.displayPages);
  }

  onSwipe(evt) {
    const x = Math.abs(evt.deltaX) > 40 ? (evt.deltaX > 0 ? 'right' : 'left') : '';
    const y = Math.abs(evt.deltaY) > 40 ? (evt.deltaY > 0 ? 'down' : 'up') : '';

    console.log(x, y);

    // if (x === 'right' && this.canPageLeft()) {
    //   // console.log('paging left...');
    //   this.pageLeft();
    // }
    // if (x === 'left' && this.canPageRight()) {
    //   // console.log('paging right...');
    //   this.pageRight();
    // }
  }
}
