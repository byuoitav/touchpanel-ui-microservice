import { Component, OnInit, Input as AngularInput } from '@angular/core';
import { ControlGroup, Display, Input, IconPair } from 'src/app/objects/control';
import { BFFService } from 'src/app/services/bff.service';
import { IControlTab } from '../control-tab/icontrol-tab';

@Component({
  selector: 'app-multi-display',
  templateUrl: './multi-display.component.html',
  styleUrls: ['./multi-display.component.scss']
})
export class MultiDisplayComponent implements OnInit, IControlTab {
  @AngularInput() cg: ControlGroup;
  selectedDisplay: Display;

  constructor(
    private bff: BFFService
  ) {

  }

  ngOnInit() {
  }

  getInputInfo(inputName: string): IconPair {
    for (const i of this.cg.inputs) {
      if (i.id.includes(inputName)) {
        return i.iconPair;
      }
    }
  }

  selectInput = (input: Input) => {
    this.bff.setInput(this.cg, input, this.selectedDisplay.getOutputNameList());
  }

  selectDisplay = (display: Display) => {
    this.selectedDisplay = display;
  }
}
