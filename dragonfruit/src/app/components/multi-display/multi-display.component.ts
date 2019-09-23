import { Component, OnInit, Input as AngularInput } from '@angular/core';
import { ControlGroup, Display, Input } from 'src/app/objects/control';
import { BFFService } from 'src/app/services/bff.service';
import { IconPair } from '../wide-button/wide-button.component';
import { IControlTab } from '../control-tab/icontrol-tab';

@Component({
  selector: 'app-multi-display',
  templateUrl: './multi-display.component.html',
  styleUrls: ['./multi-display.component.scss']
})
export class MultiDisplayComponent implements OnInit, IControlTab {
  @AngularInput() cg: ControlGroup;

  selectedDisplayGroup: Display[];

  constructor(
    private bff: BFFService
  ) {

  }

  ngOnInit() {
  }

  selectDisplay = (display: Display) => {
    this.selectedDisplayGroup = [display];
  }

  selectInput = (input: Input) => {
    for (const d of this.selectedDisplayGroup) {
      d.input = input.name;
    }
  }

  getInputIcon = (inputName: string) => {
    for (const i of this.cg.inputs) {
      if (i.name === inputName) {
        return i.icon;
      }
    }
    return '';
  }

  getMainIcons = (displays: Display[]): IconPair[] => {
    const toReturn: IconPair[] = [];

    for (const d of displays) {
      toReturn.push(
        {
          icon: d.icon,
          name: d.name
        }
      );
    }

    return toReturn;
  }

  getSubIcons = (displays: Display[]): IconPair[] => {
    const toReturn: IconPair[] = [];

    for (const d of displays) {
      const ip = toReturn.find((pair) => {
        return pair.name === d.input;
      });

      if (!ip) {
        const input = this.cg.inputs.find((i) => {
          return i.name === d.input;
        });

        toReturn.push(
          {
            icon: input.icon,
            name: input.name
          }
        );
      }
    }

    return toReturn;
  }
}
