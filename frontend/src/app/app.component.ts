import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import * as moment from 'moment';
import { TenantService } from './services/tenant.service';
import { Tenant } from './models/tenant';
import { User } from './models/user';
import { TenantRelation } from './models/tenant-relation';
import { AppService } from './services/app.service';

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
  tenantRelations: TenantRelation[];

  constructor(
    private authenticationService: AuthenticationService,
    private tenantService: TenantService,
    private appService: AppService
  ) {
    moment.locale('de');
  }

  ngOnInit(): void {
    this.appService.tenant.subscribe((tenant: Tenant) => {
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
    this.appService.user.subscribe((user: User) => {
      if (user) {
        this.username = user.name;
        // if there is a user, load all related tenants for this user
        this.loadTenantRelations();
      } else {
        this.username = null;
      }
    });
    this.appService.tenantRelations.subscribe(tenantRelations => {
      this.tenantRelations = tenantRelations;
    });
  }

  private loadTenantRelations(): void {
    this.tenantService
      .getAll()
      .subscribe((tenantRelations: TenantRelation[]) => {
        if (
          tenantRelations.length === 1 &&
          tenantRelations[0].active &&
          (!this.tenant ||
            (this.tenant &&
              this.tenant.path !== tenantRelations[0].tenant.path))
        ) {
          this.tenantService.load(tenantRelations[0].tenant.path);
        }
      });
  }

  isAdminOfCurrentTenant(): boolean {
    if (this.appService.getCurrentTenant() && this.tenantRelations) {
      return (
        this.tenantRelations.find(
          tr =>
            tr.tenantId === this.appService.getCurrentTenant().id && tr.active
        ) !== undefined
      );
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this.appService.getCurrentUser() !== null;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
