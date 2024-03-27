import { Component, Input, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef } from "@angular/core";

const LOW = 3;
const REDIRECT: string = "http://" + window.location.hostname + ":10000/dashboard";

@Component({
  selector: "management",
  templateUrl: "./management.component.html",
  styleUrls: ["./management.component.scss", "../colorscheme.scss"]
})
export class ManagementComponent implements OnChanges, OnInit {
  @Input()
  enabled: boolean;
  defcon: number;

  @ViewChild('topleft') top!: ElementRef;

  constructor() {
    this.reset();
  }

  ngOnInit(): void {
    this.reset();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("changes: ", changes.prop);
    this.reset();
  }

  public update(level: number) {
    console.log("defcon", this.defcon);

    switch (level) {
      case LOW:
        if (this.defcon === LOW) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case LOW - 1:
        if (this.defcon === LOW - 1) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case LOW - 2:
        if (this.defcon === LOW - 2) {
          this.defcon--;
        } else {
          this.reset();
        }
        break;
      case LOW - 3:
        if (this.defcon === LOW - 3) {
          console.log("redirecting to dashboard", REDIRECT);
          location.assign(REDIRECT);
        } else {
          this.reset();
        }
        break;
      default:
        this.reset();
        break;
    }
  }

  reset() {
    this.top.nativeElement.blur();
    this.defcon = LOW;
  }
}
