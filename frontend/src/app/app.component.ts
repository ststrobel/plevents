import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import * as moment from 'moment';
import { TenantService } from './services/tenant.service';
import { Tenant } from './models/tenant';
import { User } from './models/user';

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
    private tenantService: TenantService
  ) {
    moment.locale('de');
  }

  ngOnInit(): void {
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        this.tenant = tenant;
      }
    });
    this.authenticationService.user.subscribe((user: User) => {
      if (user) {
        this.username = user.name;
      } else {
        this.username = null;
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authenticationService.userValue !== null;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
