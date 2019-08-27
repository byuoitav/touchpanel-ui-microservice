import { Component, OnInit } from '@angular/core';

export class FooterElement {
  name: string;
  icon: string;
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
      icon: "center_focus_strong"   //control_camera is the right one but does funky things to the page
    },
    {
      name: "Audio",
      icon: "volume_up"
    },
    {
      name: "Present",
      icon: "present_to_all"
    },
    {
      name: "Help",
      icon: "help"
    }
  ]

  constructor() { }

  ngOnInit() {
  }

}
