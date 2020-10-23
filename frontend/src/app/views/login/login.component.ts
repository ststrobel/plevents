import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TenantService } from 'src/app/services/tenant.service';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from 'src/app/services/app.service';
import { Subscription } from 'rxjs';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  loading = false;
  submitted = false;
  returnUrl: string;
  error = '';
  tenant: Tenant;
  userSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tenantService: TenantService,
    private appService: AppService
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
        this.router.navigate([`/${ROUTES.PROFILE}`]);
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
          this.appService.setColor(this.tenant);
          // get return url from route parameters or default to '/'
          this.returnUrl =
            this.route.snapshot.queryParams['returnUrl'] ||
            this.tenant.path + '/' + ROUTES.TENANT_PLANNER;
        }
      });
      this.tenantService.load(this.tenantPath());
    } else {
      this.returnUrl = ROUTES.MY_TENANTS;
    }
    this.loginForm;
  }

  ngOnDestroy(): void {
    this.appService.setColor(null);
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
          this.error = 'Nutzername oder Passwort ist falsch';
          this.loading = false;
        }
      );
  }
}
