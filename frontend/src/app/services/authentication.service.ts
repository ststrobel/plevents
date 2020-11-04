import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User, UserAdapter } from '../models/user';
import { AppService } from './app.service';
import { ROUTES } from '../../../../common/frontend.routes';
import { UserI } from '../../../../common/user';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  constructor(
    private router: Router,
    private http: HttpClient,
    private appService: AppService,
    private userAdapter: UserAdapter
  ) {
    if (localStorage.getItem('user')) {
      const storedData = JSON.parse(localStorage.getItem('user'));
      const user = this.userAdapter.adapt(storedData);
      user.authdata = storedData.authdata;
      this.appService.setCurrentUser(user);
    }
  }

  login(email: string, password: string) {
    const user = new User(email);
    user.password = password;
    return this.http
      .post<User>(`${environment.apiUrl}/authenticate`, user)
      .pipe(
        map((loggedInUser: UserI) => {
          // store user details and basic auth credentials in local storage to keep user logged in between page refreshes
          this.update(this.userAdapter.adapt(loggedInUser), password);
          return loggedInUser;
        })
      );
  }

  /**
   * this will update the user object in the application's cache. this can happen in the following scenarios:
   * - after successful login (with password)
   * - after update of user profile
   * - after update of password (with password)
   * - when opening the profile page
   * - when loading the stored user object from local storage (with password)
   * @param user
   * @param password
   */
  update(user: User, password?: string): void {
    if (user) {
      if (password) {
        user.authdata = window.btoa(user.email + ':' + password);
      } else {
        delete user.authdata;
      }
      let existingUserData: User;
      if (localStorage.getItem('user')) {
        const storedData = JSON.parse(localStorage.getItem('user'));
        existingUserData = this.userAdapter.adapt(storedData);
        existingUserData.authdata = storedData.authdata;
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
