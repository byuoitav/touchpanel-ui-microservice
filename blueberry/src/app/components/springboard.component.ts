import { Component, Input, OnInit } from '@angular/core';


export interface SpringboardItem {
    getColor(): string;
    getIcon(): string;
    getName(): string;
}

export class Page {
    // an array with a max...
    items: SpringboardItem[];
}

@Component({
    selector: 'springboard',
    template: `
        <div class="basediv" [ngStyle]="{'height': size, 'width': size}">
        </div>
    `,
    styles: [`
        .basediv {
            background-color: blue; 
            border-radius: 6vw;
            // box-shadow, outline, etc
        }

        .items {
        
            .item {
        
            }
        }

    `]
})
export class SpringboardComponent implements OnInit {
    @Input() size: string;
    @Input() items: SpringboardItem[];

    // pages is a map of the page to its children

    constructor() {}

    ngOnInit() {
    
    }

    private breakup() {
    }
}
