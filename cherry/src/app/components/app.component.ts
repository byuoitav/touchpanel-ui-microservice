import { Component, ViewEncapsulation } from '@angular/core';

import { DataService } from '../services/data.service';

@Component({
    selector: 'cherry',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
    constructor(private data: DataService) {
        this.data.loaded.subscribe(() => {})
    }
}
