import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "./services/authentication.service";
import * as moment from "moment";
import { TenantService } from "./services/tenant.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "frontend";
  serverResult: "";
  receivedEmail: "";

  constructor(
    private authenticationService: AuthenticationService,
    private tenantService: TenantService,
    private route: ActivatedRoute
  ) {
    moment.locale("de");
  }

  ngOnInit(): void {
    if (this.route.snapshot.params.tenantPath) {
      this.tenantService.load(this.route.snapshot.params.tenantPath);
    }
  }

  isLoggedIn(): boolean {
    return this.authenticationService.userValue !== null;
  }

  username(): string {
    return this.authenticationService.userValue.name;
  }

  logout(): void {
    this.authenticationService.logout();
  }

  tenantPath(): string {
    if (this.tenantService.currentTenantValue) {
      return this.tenantService.currentTenantValue.path;
    }
    return null;
  }
}
