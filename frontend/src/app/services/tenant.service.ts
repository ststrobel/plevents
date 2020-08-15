import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { TenantAdapter, Tenant } from "../models/tenant";
import { UserAdapter, User } from "../models/user";
import { Observable, BehaviorSubject } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class TenantService {
  private currentTenantSubject: BehaviorSubject<Tenant>;
  public currentTenant: Observable<Tenant>;

  constructor(
    private http: HttpClient,
    private tenantAdapter: TenantAdapter,
    private userAdapter: UserAdapter
  ) {
    this.currentTenantSubject = new BehaviorSubject<Tenant>(null);
    this.currentTenant = this.currentTenantSubject.asObservable();
  }

  public get currentTenantValue(): Tenant {
    return this.currentTenantSubject.value;
  }

  load(tenantPath: string) {
    if (
      this.currentTenantValue &&
      this.currentTenantValue.path === tenantPath
    ) {
      this.currentTenantSubject.next(this.currentTenantValue);
    } else {
      // we must load the tenant from server-side
      this.getByPath(tenantPath).subscribe((tenant: Tenant) => {
        this.currentTenantSubject.next(tenant);
      });
    }
  }

  getByPath(tenantPath: string): Observable<Tenant> {
    return this.http
      .get<User>(`${environment.apiUrl}/tenants/${tenantPath}`)
      .pipe(
        // Adapt the raw item
        map((item) => this.tenantAdapter.adapt(item))
      );
  }

  get(tenantId: number): Observable<Tenant> {
    return this.http
      .get<User>(`${environment.apiUrl}/secure/tenants/${tenantId}`)
      .pipe(
        // Adapt the raw item
        map((item) => this.tenantAdapter.adapt(item))
      );
  }

  update(tenant: Tenant): Observable<Tenant> {
    return this.http
      .put<User>(`${environment.apiUrl}/secure/tenants/${tenant.id}`, tenant)
      .pipe(
        // Adapt the raw item
        map((item) => this.tenantAdapter.adapt(item))
      );
  }

  delete(tenantId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/secure/tenants/${tenantId}`);
  }

  getUsers(tenantId: number): Observable<User[]> {
    return this.http
      .get<User[]>(`${environment.apiUrl}/secure/tenants/${tenantId}/users`)
      .pipe(
        // Adapt the raw items
        map((data: any[]) => data.map((item) => this.userAdapter.adapt(item)))
      );
  }

  addUser(user: User, tenantId: number): Observable<User> {
    return this.http
      .post<User[]>(`${environment.apiUrl}/tenants/${tenantId}/users`, user)
      .pipe(
        // Adapt the raw items
        map((item) => this.userAdapter.adapt(item))
      );
  }
}
