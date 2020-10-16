import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TenantService } from 'src/app/services/tenant.service';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from 'src/app/services/app.service';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  error = '';
  tenant: Tenant;
  userSubscription: Subscription;
  passwordResetStatus = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tenantService: TenantService,
    private appService: AppService,
    private userService: UserService
  ) {
    // redirect to home if already logged in
    if (this.appService.getCurrentUser()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    // check if there is a logged-in user already. if so, forward directly to the profile
    this.userSubscription = this.appService.user.subscribe(user => {
      if (user) {
        this.router.navigate(['/profil']);
      }
    });
    if (this.tenantPath()) {
      // load the tenant information and redirect in case tenant path does not exist:
      this.tenantService.getByPath(this.tenantPath()).subscribe(
        () => {},
        (error: any) => {
          if (
            error === 'Not Found' ||
            (error instanceof HttpErrorResponse && error.status === 404)
          ) {
            this.router.navigate(['fehler', 'account-not-found']);
          }
        }
      );
      this.appService.tenant.subscribe((tenant: Tenant) => {
        if (tenant) {
          this.tenant = tenant;
          // get return url from route parameters or default to '/'
          this.returnUrl =
            this.route.snapshot.queryParams['returnUrl'] ||
            this.tenant.path + '/dashboard';
        }
      });
      this.tenantService.load(this.tenantPath());
    } else {
      this.returnUrl = 'profil';
    }
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
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
        this.loginForm.get('username').value,
        this.loginForm.get('password').value
      )
      .subscribe(
        data => {
          this.router.navigate(this.returnUrl.split('/'));
        },
        error => {
          this.error =
            'Nutzername oder Passwort ist falsch, oder Ihr Account ist noch nicht aktiviert.';
          this.loading = false;
        }
      );
  }

  requestPasswordReset(): void {
    this.submitted = true;
    // if a valid email is given, use that email to send a password reset mail to
    if (this.loginForm.get('username').invalid) {
      this.loginForm.get('username').markAsDirty();
      return;
    }
    this.userService
      .initiatePasswordReset(this.loginForm.get('username').value)
      .subscribe(
        () => {
          this.passwordResetStatus = 'success';
        },
        error => {
          console.error(error);
          this.passwordResetStatus = 'error';
        }
      );
  }
}
