import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from 'src/app/models/user';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AppService } from 'src/app/services/app.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  error: string = null;
  loading: boolean = false;
  success: boolean = false;
  userSubscription: Subscription;
  isLoggedIn: boolean = false;

  constructor(
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private userService: UserService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.appService.user.subscribe((user: User) => {
      this.isLoggedIn = user !== null;
    });
    if (this.route.snapshot.params.tenantPath) {
      this.tenantService.load(this.route.snapshot.params.tenantPath);
    }
    this.registrationForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      name: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  ngOnDestroy(): void {
    this.appService.setColor(null);
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
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
    if (this.isLoggedIn) {
      return;
    }
    const user = new User(this.registrationForm.get('email').value);
    user.name = this.registrationForm.get('name').value;
    user.password = this.registrationForm.get('password').value;
    this.userService
      .register(user, this.route.snapshot.params.tenantPath)
      .subscribe(
        () => {
          this.success = true;
        },
        error => {
          console.error(error);
        }
      );
  }
}
