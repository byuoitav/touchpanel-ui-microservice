import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { InputAction } from '../io-button/io-button.component';
import { ViewEncapsulation } from '@angular/compiler/src/core';
import { FooterElement } from '../footer/footer.component';

class FooterButtonBase {
  constructor(public _elementRef: ElementRef) { }
}

@Component({
  selector: 'app-footer-button',
  // encapsulation: ViewEncapsulation.None,
  templateUrl: './footer-button.component.html',
  styleUrls: ['./footer-button.component.scss']
})
export class FooterButtonComponent extends FooterButtonBase implements OnInit {
  @Input() info: FooterElement;

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
    this.toggleSelect();
    if (!f) {
      console.warn('no function for this action has been defined');
      return;
    }
  }

}
