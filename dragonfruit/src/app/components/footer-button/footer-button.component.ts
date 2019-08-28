import { Component, OnInit, Input, ElementRef, EventEmitter, Output } from '@angular/core';
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
  @Output() selectedEvent = new EventEmitter<string>();

  @Input() click: InputAction;
  @Input() press: InputAction;

  constructor(elementRef: ElementRef) {
    super(elementRef);
  }

  ngOnInit() {
  }

  toggleSelect(): boolean {
    if (!this.info.selected) {
      this.info.selected = !this.info.selected;
      return true;
    }
    return false;
  }

  buttonSelected() {
    if (this.toggleSelect()) {
      this.selectedEvent.emit(this.info.name);
    }
  }
}
