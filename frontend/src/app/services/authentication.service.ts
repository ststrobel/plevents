import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserI } from '../../../../common/user';
import { environment } from 'src/environments/environment';
import { User } from '../models/user';
import { TenantService } from './tenant.service';
import { AppService } from './app.service';
import { ROUTES } from '../../../../common/frontend.routes';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  constructor(
    private router: Router,
    private http: HttpClient,
    private tenantService: TenantService,
    private appService: AppService
  ) {
    if (localStorage.getItem('user')) {
      this.appService.setCurrentUser(JSON.parse(localStorage.getItem('user')));
    }
  }

  login(email: string, password: string) {
    const user = new User(email);
    user.password = password;
    return this.http
      .post<User>(`${environment.apiUrl}/authenticate`, user)
      .pipe(
        map((loggedInUser: User) => {
          // store user details and basic auth credentials in local storage to keep user logged in between page refreshes
          this.update(loggedInUser, password);
          return loggedInUser;
        })
      );
  }

  update(user: User, password?: string): void {
    if (user) {
      if (password) {
        user.authdata = window.btoa(user.email + ':' + password);
      } else {
        delete user.authdata;
      }
      let existingUserData: User;
      if (localStorage.getItem('user')) {
        existingUserData = JSON.parse(localStorage.getItem('user')) as User;
      } else {
        existingUserData = user;
      }
      const updatedUserData = Object.assign(existingUserData, user);
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      this.appService.setCurrentUser(updatedUserData);
    }
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
    this.appService.setCurrentUser(null);
    this.appService.setCurrentTenantRelations(null);
    if (
      this.appService.getCurrentTenant() &&
      this.appService.getCurrentTenant().path
    ) {
      this.router.navigate([
        this.appService.getCurrentTenant().path,
        ROUTES.LOGIN,
      ]);
    } else {
      this.router.navigate([`/${ROUTES.LOGIN}`]);
    }
  }
}
