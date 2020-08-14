import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { UserAdapter, User } from "../models/user";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { map } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class UserService {
  constructor(private http: HttpClient, private userAdapter: UserAdapter) {}

  delete(userId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/secure/users/${userId}`);
  }

  activate(userId: number): Observable<User> {
    return this.http
      .put(`${environment.apiUrl}/secure/users/${userId}/active/true`, null)
      .pipe(
        // Adapt the raw item
        map((item) => this.userAdapter.adapt(item))
      );
  }

  deactivate(userId: number): Observable<User> {
    return this.http
      .put(`${environment.apiUrl}/secure/users/${userId}/active/false`, null)
      .pipe(
        // Adapt the raw item
        map((item) => this.userAdapter.adapt(item))
      );
  }
}
