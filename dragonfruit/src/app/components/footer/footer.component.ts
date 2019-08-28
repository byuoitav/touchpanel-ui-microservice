import { Component, OnInit } from '@angular/core';

export class FooterElement {
  name: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  footerButtons: FooterElement[] = [
    {
      name: "Control",
      icon: "center_focus_strong",   //control_camera is the right one but does funky things to the page
      selected: true
    },
    {
      name: "Audio",
      icon: "volume_up",
      selected: false
    },
    {
      name: "Present",
      icon: "present_to_all",
      selected: false
    },
    {
      name: "Help",
      icon: "help",
      selected: false
    }
  ]

  constructor() { }

  ngOnInit() {
  }

  selected(button: string) {
    for (let btn of this.footerButtons) {
      if (btn.name != button) {
        btn.selected = false;
      }
    }
    // Change the page
  }

}
