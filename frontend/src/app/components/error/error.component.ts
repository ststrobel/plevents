import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: "error",
  templateUrl: "./error.component.html",
  styleUrls: ["./error.component.scss"],
})
export class ErrorComponent implements OnInit {

  errorTitle: string;
  errorMessage: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // extract the error type parameter and display it accordingly
    const type = this.route.snapshot.params.errortype;
    if (type === 'account-not-found') {
      this.errorTitle = 'Fehler';
      this.errorMessage = 'Es ist ein Fehler aufgetreten';
    } else {
      this.errorTitle = 'Fehler';
      this.errorMessage = 'Es ist ein Fehler aufgetreten';
    }
  }
}
