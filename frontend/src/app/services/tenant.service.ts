import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { TenantAdapter, Tenant } from '../models/tenant';
import { Observable, Subscription, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  TenantRelation,
  TenantRelationAdapter,
} from '../models/tenant-relation';
import { AppService } from './app.service';
import { Invitation, InvitationAdapter } from '../models/invitation';
import { clone } from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private checkPathSubscription: Subscription = null;

  constructor(
    private http: HttpClient,
    private tenantAdapter: TenantAdapter,
    private tenantRelationAdapter: TenantRelationAdapter,
    private appService: AppService,
    private invitationAdapter: InvitationAdapter,
    private domSanitizer: DomSanitizer
  ) {}

  /**
   * loads the tenant for the given path.
   * if the tenant is already loaded, it is not requested at the backend again.
   * @param tenantPath
   */
  load(tenantPath: string, force: boolean = false) {
    if (
      !force &&
      this.appService.getCurrentTenant() &&
      this.appService.getCurrentTenant().path === tenantPath
    ) {
      this.appService.setCurrentTenant(this.appService.getCurrentTenant());
    } else {
      // we must load the tenant from server-side
      this.getByPath(tenantPath).subscribe((tenant: Tenant) => {
        this.appService.setCurrentTenant(tenant);
      });
    }
  }

  getByPath(tenantPath: string): Observable<Tenant> {
    if (
      this.appService.getCurrentTenant() &&
      this.appService.getCurrentTenant().path === tenantPath
    ) {
      return of(this.appService.getCurrentTenant());
    } else {
      return this.http.get(`${environment.apiUrl}/tenants/${tenantPath}`).pipe(
        // Adapt the raw item
        map(item => this.tenantAdapter.adapt(item))
      );
    }
  }

  get(tenantId: string): Observable<Tenant> {
    if (
      this.appService.getCurrentTenant() &&
      this.appService.getCurrentTenant().id === tenantId
    ) {
      return of(this.appService.getCurrentTenant());
    } else {
      return this.http
        .get(`${environment.apiUrl}/secure/tenants/${tenantId}`)
        .pipe(
          // Adapt the raw item
          map(item => this.tenantAdapter.adapt(item))
        );
    }
  }

  /**
   * loads all tenant relationships for the current user
   */
  getAll(): Observable<TenantRelation[]> {
    return this.http.get(`${environment.apiUrl}/secure/tenants`).pipe(
      // Adapt the raw item
      map((data: any[]) =>
        data.map(item => this.tenantRelationAdapter.adapt(item))
      ),
      tap(tenantRelations => {
        this.appService.setCurrentTenantRelations(tenantRelations);
      })
    );
  }

  update(tenant: Tenant): Observable<Tenant> {
    const tenantToUpdate = clone(tenant);
    // update the logo from the current tenant object
    if (tenantToUpdate.logo) {
      if (typeof tenantToUpdate.logo === 'object') {
        // it's a SafeResourceUrl oject - convert it to string first
        tenantToUpdate.logo = this.domSanitizer.sanitize(
          SecurityContext.RESOURCE_URL,
          tenantToUpdate.logo
        );
      }
    }
    return this.http
      .put(
        `${environment.apiUrl}/secure/tenants/${tenantToUpdate.id}`,
        tenantToUpdate
      )
      .pipe(
        // Adapt the raw item
        map(item => this.tenantAdapter.adapt(item)),
        tap((tenant: Tenant) => {
          if (tenant.id === this.appService.getCurrentTenant().id) {
            this.appService.setCurrentTenant(tenant);
          }
        })
      );
  }

  create(tenant: Tenant): Observable<Tenant> {
    return this.http.post(`${environment.apiUrl}/secure/tenants`, tenant).pipe(
      // Adapt the raw item
      map(item => this.tenantAdapter.adapt(item))
    );
  }

  delete(tenantId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/secure/tenants/${tenantId}`);
  }

  getUsers(tenantId: string): Observable<TenantRelation[]> {
    return this.http
      .get(`${environment.apiUrl}/secure/tenants/${tenantId}/users`)
      .pipe(
        // Adapt the raw items
        map((data: any[]) =>
          data.map(item => this.tenantRelationAdapter.adapt(item))
        )
      );
  }

  getOpenInvitations(tenantId: string): Observable<Invitation[]> {
    return this.http
      .get(`${environment.apiUrl}/secure/tenants/${tenantId}/invitations`)
      .pipe(
        // Adapt the raw items
        map((data: any[]) =>
          data.map(item => this.invitationAdapter.adapt(item))
        )
      );
  }

  revokeOpenInvitations(
    tenantId: string,
    invitationId: string
  ): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/secure/tenants/${tenantId}/invitations/${invitationId}`
    );
  }

  addUser(tenantId: string, email: string): Observable<Invitation> {
    return this.http
      .post(`${environment.apiUrl}/secure/tenants/${tenantId}/users`, {
        email,
      })
      .pipe(
        // Adapt the raw items
        map(item => this.invitationAdapter.adapt(item))
      );
  }

  /**
   * will check if a given path is already taken by someone. the result (true|false) will be set on the parameter variable "checkResultReference"
   * @param pathToCheck
   */
  checkPath(
    pathToCheck: string,
    checkResultReference: { pathTaken: boolean }
  ): void {
    // unsubscribe from any potential previous request:
    if (this.checkPathSubscription) {
      this.checkPathSubscription.unsubscribe();
    }
    this.checkPathSubscription = this.getByPath(pathToCheck).subscribe(
      potentiallyExistingTenant => {
        // now check if a tenant exists:
        if (
          potentiallyExistingTenant &&
          potentiallyExistingTenant.path === pathToCheck
        ) {
          checkResultReference.pathTaken = true;
          this.checkPathSubscription.unsubscribe();
          this.checkPathSubscription = null;
        } else {
          checkResultReference.pathTaken = false;
          this.checkPathSubscription.unsubscribe();
          this.checkPathSubscription = null;
        }
      },
      error => {
        checkResultReference.pathTaken = false;
        this.checkPathSubscription.unsubscribe();
        this.checkPathSubscription = null;
      }
    );
  }
}
