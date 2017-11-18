import { Component, Input as AngularInput } from '@angular/core';

import { DataService } from '../services/data.service';
import { Input, Display } from '../objects/status.objects';

@Component({
    selector: 'advanced',
    templateUrl: './advanced.component.html',
    styleUrls: ['./advanced.component.scss', '../colorscheme.scss'],
})
export class AdvancedComponent {

    @AngularInput() visible: boolean;

    constructor(private data: DataService) {}
}
