import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TenantService } from 'src/app/services/tenant.service';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  error = '';
  tenant: Tenant;

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
          this.error = 'Nutzername oder Passwort falsch';
          this.loading = false;
        }
      );
  }
}
