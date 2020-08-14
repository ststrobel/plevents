import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { TenantService } from "src/app/services/tenant.service";

@Component({
  selector: "app-tenant-registration",
  templateUrl: "./tenant-registration.component.html",
  styleUrls: ["./tenant-registration.component.scss"],
})
export class TenantRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  error: string = null;
  loading: boolean = false;

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      name: new FormControl("", [Validators.required]),
      path: new FormControl("", Validators.required),
    });
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
  }
}
