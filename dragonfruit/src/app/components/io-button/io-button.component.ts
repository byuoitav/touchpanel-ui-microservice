import { Component, OnInit, ViewEncapsulation, Input, ElementRef } from '@angular/core';
import { IOConfiguration } from '../../objects/database';


class IOButtonBase {
  constructor(public _elementRef: ElementRef) {}
}

export type InputAction = (io: IOConfiguration) => Promise<boolean>;

@Component({
  selector: 'io-button',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './io-button.component.html',
  styleUrls: ['./io-button.component.scss']
})
export class IOButtonComponent extends IOButtonBase implements OnInit {
  @Input() io: IOConfiguration;
  @Input() click: InputAction;
  @Input() press: InputAction;
  @Input() selected = false;

  constructor(elementRef: ElementRef) {
    super(elementRef);
  }

  ngOnInit() {
  }

  toggleSelect = () => {
    this.selected = !this.selected;
  }

  do(f: InputAction) {
    if (!f) {
      console.warn('no function for this action has been defined');
      return;
    }

    f(this.io);
  }
}
