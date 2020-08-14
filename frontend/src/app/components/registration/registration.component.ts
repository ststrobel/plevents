import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { User } from "src/app/models/user";
import { TenantService } from "src/app/services/tenant.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-registration",
  templateUrl: "./registration.component.html",
  styleUrls: ["./registration.component.scss"],
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  error: string = null;
  loading: boolean = false;
  success: boolean = false;

  constructor(
    private tenantService: TenantService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.registrationForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      name: new FormControl("", Validators.required),
      password: new FormControl("", Validators.required),
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
    const user = new User(this.registrationForm.get("email").value);
    user.name = this.registrationForm.get("name").value;
    user.password = this.registrationForm.get("password").value;
    this.tenantService.addUser(user, 1).subscribe((user: User) => {
      this.success = true;
    });
  }
}
