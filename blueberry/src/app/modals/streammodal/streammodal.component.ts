import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Input } from "app/objects/status.objects";

@Component({
  selector: "stream-modal",
  templateUrl: "./streammodal.component.html",
  styleUrls: ["./streammodal.component.scss"]
})
export class StreamModalComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: Input, public dialogRef: MatDialogRef<StreamModalComponent>) { }

  ngOnInit() {
  }

}
