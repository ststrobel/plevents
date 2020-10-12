import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import * as moment from 'moment';
import { TenantService } from './services/tenant.service';
import { Tenant } from './models/tenant';
import { User } from './models/user';
import { NgcCookieConsentService } from 'ngx-cookieconsent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  serverResult: '';
  receivedEmail: '';
  tenant: Tenant = null;
  username: string = null;

  constructor(
    private authenticationService: AuthenticationService,
    private tenantService: TenantService,
    private ccService: NgcCookieConsentService
  ) {
    moment.locale('de');
  }

  ngOnInit(): void {
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        this.tenant = tenant;
        // when a (potentially other) tenant is selected, check if a specific color is set. if so, modify the body variable to reflect the color (theme) change
        if (tenant.color) {
          document.querySelector(
            'body'
          ).style.cssText = `--plevents-main-color: ${tenant.color}; --plevents-main-color-darkened: ${tenant.colorDarkened};`;
        }
      }
    });
    this.authenticationService.user.subscribe((user: User) => {
      if (user) {
        this.username = user.name;
        // if there is a user, load all related tenants for this user
        this.tenantService.getAll().subscribe(tenants => {
          if (tenants.length === 1) {
            this.tenantService.load(tenants[0].path);
          }
        });
      } else {
        this.username = null;
      }
    });
    this.ccService.initialize$.subscribe((event: any) => {
      console.log(event);
      // you can use this.ccService.getConfig() to do stuff...
    });
  }

  isLoggedIn(): boolean {
    return this.authenticationService.userValue !== null;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
