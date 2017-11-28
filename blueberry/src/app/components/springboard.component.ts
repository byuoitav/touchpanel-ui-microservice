import { Component, Input, OnInit } from '@angular/core';


export interface SpringboardItem {
    getName(): string;
    getDisplayName(): string;
    getIcon(): string;
    getColor(): string;
}

class Page {
    items: SpringboardItem[] = [];
}

const MAX_ITEMS = 3;

@Component({
    selector: 'springboard',
    template: `
        <div class="basediv" [ngStyle]="{'height': size, 'width': size}">
            <div *ngFor="let page of pages">
                <div *ngFor="let item of page.items">
                    <span>{{item.getName()}}</span>
                </div>
            </div>
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
    private pages: Page[] = [];

    constructor() {}

    ngOnInit() {
        setTimeout(() => {
            this.breakup();
        }, 0);
    }

    private breakup() {
        let pageNum = -1;

        for (let i = 0; i < this.items.length; ++i) {
            if (i % MAX_ITEMS == 0) {
                pageNum++; 
                this.pages.push(new Page());
            }
            this.pages[pageNum].items.push(this.items[i]);
        }

        console.log("pages", this.pages);
    }
}
