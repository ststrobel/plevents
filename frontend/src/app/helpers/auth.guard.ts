import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivate,
} from '@angular/router';
import { AppService } from '../services/app.service';
import { AuthenticationService } from '../services/authentication.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private appService: AppService
  ) {}
  path: ActivatedRouteSnapshot[];
  route: ActivatedRouteSnapshot;

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const user = this.appService.getCurrentUser();
    if (user) {
      // logged in so return true
      return true;
    }
    // not logged in so redirect to login page with the return url
    this.router.navigate(
      route.params.tenantPath ? [route.params.tenantPath, 'login'] : ['/login'],
      {
        queryParams: { returnUrl: state.url },
      }
    );
    return false;
  }
}
