import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from 'src/app/models/user';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  error: string = null;
  loading: boolean = false;
  success: boolean = false;

  constructor(
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.registrationForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      name: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
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
    const user = new User(this.registrationForm.get('email').value);
    user.name = this.registrationForm.get('name').value;
    user.password = this.registrationForm.get('password').value;
    this.tenantService
      .addUser(user, this.tenantService.currentTenantValue.id)
      .subscribe((createdUser: User) => {
        // if the user is active immediatly, log him in. else, show a notification
        if (createdUser.active) {
          this.authenticationService
            .login(user.email, user.password)
            .subscribe(data => {
              this.router.navigate([
                this.route.snapshot.params.tenantPath,
                'dashboard',
              ]);
            });
        } else {
          this.success = true;
        }
      });
  }
}
