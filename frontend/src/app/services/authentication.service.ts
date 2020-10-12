import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserI } from '../../../../common/user';
import { environment } from 'src/environments/environment';
import { User } from '../models/user';
import { TenantService } from './tenant.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private userSubject: BehaviorSubject<UserI>;
  public user: Observable<UserI>;

  constructor(
    private router: Router,
    private http: HttpClient,
    private tenantService: TenantService
  ) {
    this.userSubject = new BehaviorSubject<UserI>(
      JSON.parse(localStorage.getItem('user'))
    );
    this.user = this.userSubject.asObservable();
  }

  public get userValue(): UserI {
    return this.userSubject.value;
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
      this.userSubject.next(updatedUserData);
    }
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
    this.userSubject.next(null);
    if (
      this.tenantService.currentTenantValue &&
      this.tenantService.currentTenantValue.path
    ) {
      this.router.navigate([
        this.tenantService.currentTenantValue.path,
        'login',
      ]);
    } else {
      this.router.navigate(['login']);
    }
  }
}
