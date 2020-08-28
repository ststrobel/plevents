import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import * as moment from 'moment';
import { TenantService } from './services/tenant.service';
import { Tenant } from './models/tenant';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  serverResult: '';
  receivedEmail: '';
  tenant: Tenant = null;
  navbarLogo: string = 'assets/cvjm-triangles-flipped.png';

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
        if (this.tenant.logo) {
          this.navbarLogo = this.tenant.logo;
        }
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authenticationService.userValue !== null;
  }

  username(): string {
    return this.authenticationService.userValue.name;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
