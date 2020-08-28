import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { first } from "rxjs/operators";
import { AuthenticationService } from "src/app/services/authentication.service";
import { TenantService } from "src/app/services/tenant.service";
import { Tenant } from "src/app/models/tenant";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  error = "";
  tenant: Tenant;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tenantService: TenantService
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.userValue) {
      this.router.navigate(["/"]);
    }
  }

  ngOnInit() {
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        this.tenant = tenant;
        // get return url from route parameters or default to '/'
        this.returnUrl =
          this.route.snapshot.queryParams["returnUrl"] || this.tenant.path + "/dashboard";
      }
    });
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.loginForm = new FormGroup({
      username: new FormControl("", Validators.required),
      password: new FormControl("", Validators.required),
    });
  }

  tenantPath(): string {
    return this.route.snapshot.params.tenantPath;
  }

  onSubmit() {
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService
      .login(
        this.tenant.id,
        this.loginForm.get("username").value,
        this.loginForm.get("password").value
      )
      .subscribe(
        (data) => {
          this.router.navigate(this.returnUrl.split("/"));
        },
        (error) => {
          this.error = error;
          this.loading = false;
        }
      );
  }
}
