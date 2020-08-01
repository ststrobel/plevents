import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "./services/authentication.service";
import * as moment from "moment";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "frontend";
  serverResult: "";
  receivedEmail: "";

  constructor(private authenticationService: AuthenticationService) {
    moment.locale("de");
  }

  ngOnInit(): void {}

  isLoggedIn(): boolean {
    return this.authenticationService.userValue !== null;
  }

  username(): string {
    return this.authenticationService.userValue.username;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
