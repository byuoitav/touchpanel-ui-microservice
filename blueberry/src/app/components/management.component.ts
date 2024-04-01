import { Component, Input, OnChanges, SimpleChanges, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from "@angular/core";
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";

const LOW = 3;
const REDIRECT: string = "http://" + window.location.hostname + ":10000/dashboard";

@Component({
  selector: "management",
  templateUrl: "./management.component.html",
  styleUrls: ["./management.component.scss", "../colorscheme.scss"]
})
export class ManagementComponent implements OnChanges, OnInit, AfterViewInit {

  @ViewChild('topleft') topleftE1: ElementRef<HTMLElement>;
  origin = this.formatOrigin(null);

  constructor(
    private focusMonitor: FocusMonitor,
    private _cdr: ChangeDetectorRef,
    private _ngZone: NgZone,
  ) {}
  
  @Input()
  enabled: boolean;
  defcon: number;

  ngAfterViewInit() {
    this.focusMonitor.monitor(this.topleftE1).subscribe(origin =>
      this._ngZone.run(() => {
        this.origin = this.formatOrigin(origin);
        this._cdr.markForCheck();
      }),
    );
  }

  formatOrigin(origin: FocusOrigin): string {
    return origin ? origin + ' focused' : 'blurred';
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.topleftE1);
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
    this.defcon = LOW;
  }
}
