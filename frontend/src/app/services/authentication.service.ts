import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserI } from "../../../../common/user";
import { environment } from "src/environments/environment";
import { User } from "../models/user";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  private userSubject: BehaviorSubject<UserI>;
  public user: Observable<UserI>;

  constructor(private router: Router, private http: HttpClient) {
    this.userSubject = new BehaviorSubject<UserI>(
      JSON.parse(localStorage.getItem("user"))
    );
    this.user = this.userSubject.asObservable();
  }

  public get userValue(): UserI {
    return this.userSubject.value;
  }

  login(username: string, password: string) {
    const user = new User(username, password);
    return this.http
      .post<User>(`${environment.apiUrl}/authenticate`, user)
      .pipe(
        map((response: any) => {
          // store user details and basic auth credentials in local storage to keep user logged in between page refreshes
          user.authdata = window.btoa(username + ":" + password);
          localStorage.setItem("user", JSON.stringify(user));
          this.userSubject.next(user);
          return user;
        })
      );
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem("user");
    this.userSubject.next(null);
    this.router.navigate(["/login"]);
  }
}
