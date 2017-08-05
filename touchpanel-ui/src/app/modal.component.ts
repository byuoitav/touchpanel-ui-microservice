import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
  <div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
       [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
	<div class="hide" (click)="hide()">
		<i class="material-icons icon">arrow_back</i>
	</div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <ng-content select=".app-modal-body"></ng-content>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
	.modal-dialog {
	  top: 25vh;
	}
	/* inside of modal */
	.modal-content {
		background: #021024;
	}
	/* area outside of modal */
	.modal {
   	 	background: rgba(164,169,173,.95);
	}
	.hide{
		position: absolute;
		top: 11vh;
		left: 7%;
		min-width: 10%;	
		min-height: 20%;
	}
	.icon {
		font-size: 10vh;	
	}
  `]
})
export class ModalComponent {
  public visible = false;
  public visibleAnimate = false;
  
  // extra information that you may need to use
  public info: any = null; 

  constructor() { }

  public show(): void {
    this.visible = true;
    setTimeout(() => this.visibleAnimate = true, 100);
  }

  public hide(): void {
    this.visibleAnimate = false;
    setTimeout(() => this.visible = false, 300);
  }

  public onContainerClicked(event: MouseEvent): void {
    if ((<HTMLElement>event.target).classList.contains('modal')) {
      this.hide();
    }
  }
}
