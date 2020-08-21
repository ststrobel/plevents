import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { TenantService } from "src/app/services/tenant.service";
import { Subscription } from "rxjs";
import { Tenant } from 'src/app/models/tenant';
import { Router } from '@angular/router';

@Component({
  selector: "app-tenant-registration",
  templateUrl: "./tenant-registration.component.html",
  styleUrls: ["./tenant-registration.component.scss"],
})
export class TenantRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  error: string = null;
  loading: boolean = false;
  currentSubscription: Subscription = null;
  pathTaken: boolean = false;

  constructor(private tenantService: TenantService, private router: Router) {}

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      name: new FormControl("", [Validators.required]),
      path: new FormControl("", [
        Validators.required,
        Validators.maxLength(40),
        Validators.pattern("[a-z-]{0,40}"),
      ]),
    });
  }

  checkPath(): void {
    // unsubscribe from any potential previous request:
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    this.currentSubscription = this.tenantService
      .getByPath(this.registrationForm.get("path").value)
      .subscribe(
        (potentiallyExistingTenant) => {
          // now check if a tenant exists:
          if (
            potentiallyExistingTenant &&
            potentiallyExistingTenant.path ===
              this.registrationForm.get("path").value
          ) {
            this.pathTaken = true;
            this.currentSubscription = null;
          } else {
            this.pathTaken = false;
            this.currentSubscription = null;
          }
        },
        (error) => {
          this.pathTaken = false;
          this.currentSubscription = null;
        }
      );
  }

  isInvalid(formControlName: string): boolean {
    return (
      this.registrationForm.get(formControlName).invalid &&
      this.registrationForm.get(formControlName).touched
    );
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }
    // create the tenant. aftewards, forward the user to the registration for the personal login
    const name = this.registrationForm.get("name").value;
    const path = this.registrationForm.get("path").value;
    this.tenantService.create(new Tenant(name, path)).subscribe((tenant: Tenant) => {
      this.router.navigate([tenant.path, "registrierung"]);
    });
  }
}
