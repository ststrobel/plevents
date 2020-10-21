import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivate,
} from '@angular/router';
import { TenantRelation } from '../models/tenant-relation';
import { AppService } from '../services/app.service';
import { find } from 'lodash';
import { of } from 'rxjs';
import { TenantService } from '../services/tenant.service';
import { map } from 'rxjs/operators';
import { ROLE } from '../../../../common/tenant-relation';
import { ROUTES } from '../../../../common/frontend.routes';

@Injectable({ providedIn: 'root' })
export class TenantGuard implements CanActivate {
  constructor(
    private router: Router,
    private appService: AppService,
    private tenantService: TenantService
  ) {}
  path: ActivatedRouteSnapshot[];
  route: ActivatedRouteSnapshot;

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.appService.getCurrentTenantRelations()) {
      const isAllowed = this.hasAccess(
        this.appService.getCurrentTenantRelations(),
        route
      );
      //console.log('Guard said: ' + (isAllowed ? 'allowed' : 'rejected'));
      return of(isAllowed);
    } else {
      return this.tenantService.getAll().pipe(
        map(tenantRelations => {
          const isAllowed = this.hasAccess(tenantRelations, route);
          //console.log('Guard said: ' + (isAllowed ? 'allowed' : 'rejected'));
          return isAllowed;
        })
      );
    }
  }

  private hasAccess(
    tenantRelations: TenantRelation[],
    route: ActivatedRouteSnapshot
  ): boolean {
    const tenantPath = route.params.tenantPath;
    const relation = find(tenantRelations, (tenantRelation: TenantRelation) => {
      return tenantRelation.active && tenantRelation.tenant.path === tenantPath;
    });
    if (relation) {
      const requiredRole = route.data.role as ROLE;
      if (requiredRole) {
        return relation.hasRole(requiredRole);
      }
      // no specific role required
      return true;
    }
    // not an internal member of the tenant - redirect user to the public events screen
    this.router.navigate([route.params.tenantPath, ROUTES.TENANT_EVENTS]);
    return false;
  }
}
