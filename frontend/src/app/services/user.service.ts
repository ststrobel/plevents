import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserAdapter, User } from '../models/user';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { UserI } from '../../../../common/user';
import { ROLE } from '../../../../common/tenant-relation';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient, private userAdapter: UserAdapter) {}

  register(user: UserI): Observable<User> {
    return this.http.post(`${environment.apiUrl}/profile`, user).pipe(
      // Adapt the raw item
      map(item => this.userAdapter.adapt(item))
    );
  }

  removeFromTenant(tenantId: string, userId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/secure/tenants/${tenantId}/users/${userId}`
    );
  }

  setRole(tenantId: string, userId: string, role: ROLE): Observable<User> {
    return this.http
      .put(
        `${environment.apiUrl}/secure/tenants/${tenantId}/users/${userId}/role/${role}`,
        null
      )
      .pipe(
        // Adapt the raw item
        map(item => this.userAdapter.adapt(item))
      );
  }

  activate(tenantId: string, userId: string): Observable<User> {
    return this.http
      .put(
        `${environment.apiUrl}/secure/tenants/${tenantId}/users/${userId}/active/true`,
        null
      )
      .pipe(
        // Adapt the raw item
        map(item => this.userAdapter.adapt(item))
      );
  }

  deactivate(tenantId: string, userId: string): Observable<User> {
    return this.http
      .put(
        `${environment.apiUrl}/secure/tenants/${tenantId}/users/${userId}/active/false`,
        null
      )
      .pipe(
        // Adapt the raw item
        map(item => this.userAdapter.adapt(item))
      );
  }

  getProfile(): Observable<User> {
    return this.http.get(`${environment.apiUrl}/secure/profile`).pipe(
      // Adapt the raw item
      map(item => this.userAdapter.adapt(item))
    );
  }

  updateProfile(user: User): Observable<User> {
    return this.http.put(`${environment.apiUrl}/secure/profile`, user).pipe(
      // Adapt the raw item
      map(item => this.userAdapter.adapt(item))
    );
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/secure/profile/password`, {
      oldPassword,
      newPassword,
    });
  }
}
