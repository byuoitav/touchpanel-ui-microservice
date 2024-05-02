import { Component, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { trigger, animate, transition } from "@angular/animations";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { DataService } from "../services/data.service";
import { ThemeService } from "../services/api.service";
import { CommandService } from "../services/command.service";
import { HelpDialog } from "../dialogs/help.dialog";
import { Output } from "../objects/status.objects";
import { AudioDialog } from "../dialogs/audio.dialog";

const HIDDEN = "hidden";
const QUERY = "query";
const LOADING = "indeterminate";
const BUFFER = "buffer";

@Component({
  selector: "cherry",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  providers: [ThemeService],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger("delay", [
      transition(":enter", [animate(500)]),
      transition(":leave", [animate(500)])
    ])
  ]
})
export class AppComponent {
  public loaded: boolean;
  public unlocking = false;
  public progressMode: string = QUERY;
  logoData: string = `
  <svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
  </svg>
  `;
  svg: SafeHtml;

  public selectedTabIndex: number;

  constructor(
    private themeService: ThemeService,
    public data: DataService,
    public command: CommandService,
    public dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {
    this.loaded = false;
    this.data.loaded.subscribe(() => {
      this.loaded = true;
    });
  }

  ngOnInit(): void {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.logoData);
    this.loadSvg();
  }

  loadSvg(): void {
    this.themeService.getLogo().subscribe(
      svgData => {
        // console.log('SVG Data:', svgData);
        this.svg = this.sanitizer.bypassSecurityTrustHtml(svgData);
      },
      error => {
        console.error('Error fetching SVG:', error);
      }
    );
  }



  public isPoweredOff(): boolean {
    if (!this.loaded) {
      return true;
    }
    return !Output.isPoweredOn(this.data.panel.preset.displays);
  }

  public unlock() {
    this.unlocking = true;
    this.progressMode = QUERY;

    this.command.powerOnDefault(this.data.panel.preset).subscribe(success => {
      if (!success) {
        this.reset();
        console.warn("failed to turn on");
      } else {
        // switch direction of loading bar
        this.progressMode = LOADING;

        this.reset();
      }
    });
  }

  public powerOff() {
    this.progressMode = QUERY;

    this.command.powerOff(this.data.panel.preset).subscribe(success => {
      if (!success) {
        console.warn("failed to turn off");
      } else {
        this.reset();
      }
    });
  }

  private reset() {
    // select displays tab
    this.selectedTabIndex = 0;

    // reset mix levels to 100
    this.data.panel.preset.audioDevices.forEach(a => (a.mixlevel = 100));

    // reset masterVolume level
    this.data.panel.preset.masterVolume = 30;

    // reset masterMute
    this.data.panel.preset.masterMute = false;

    // stop showing progress bar
    this.unlocking = false;
  }

  public openHelpDialog() {
    const dialogRef = this.dialog.open(HelpDialog, {
      width: "70vw",
      disableClose: true
    });
  }

  public openAudio() {
    let dialogData = {};
    if (this.data && this.data.panel) {
      dialogData['preset'] = this.data.panel.preset;
    }
    if (this.data && this.data.panel && this.data.panel.features) {
      dialogData['audioGroups'] = !this.data.panel.features.includes('no-audio-groups');
    }

    const dialogRef = this.dialog.open(AudioDialog, {
      height: '480px',
      width: '800px',
      data: dialogData
    });
  }
}
