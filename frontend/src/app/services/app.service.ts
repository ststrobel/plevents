import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tenant } from '../models/tenant';
import { User } from '../models/user';
import { TenantRelation } from '../models/tenant-relation';
import { ROLE } from '../../../../common/tenant-relation';
import { find } from 'lodash';

@Injectable({ providedIn: 'root' })
export class AppService {
  private userSubject: BehaviorSubject<User>;
  public user: Observable<User>;
  private tenantSubject: BehaviorSubject<Tenant>;
  public tenant: Observable<Tenant>;
  private tenantRelationsSubject: BehaviorSubject<TenantRelation[]>;
  public tenantRelations: Observable<TenantRelation[]>;

  constructor() {
    this.userSubject = new BehaviorSubject<User>(null);
    this.user = this.userSubject.asObservable();
    this.tenantSubject = new BehaviorSubject<Tenant>(null);
    this.tenant = this.tenantSubject.asObservable();
    this.tenantRelationsSubject = new BehaviorSubject<TenantRelation[]>(null);
    this.tenantRelations = this.tenantRelationsSubject.asObservable();
  }

  /**
   * sets the overall text color based on the tenant. if tenant is null, it defaults to the plevents standard color
   * @param color
   */
  setColor(tenant: Tenant): void {
    let color: string, colorDarkened: string;
    if (tenant && tenant.color) {
      color = tenant.color;
      colorDarkened = tenant.colorDarkened;
    } else {
      color = ' #2f5597';
      colorDarkened = '#344f7d';
    }
    document.querySelector(
      'body'
    ).style.cssText = `--plevents-main-color: ${color}; --plevents-main-color-darkened: ${colorDarkened};`;
  }

  setCurrentTenant(tenant: Tenant): void {
    if (this.tenantSubject.value !== tenant) {
      this.tenantSubject.next(tenant);
    }
  }

  setCurrentTenantRelations(tenantRelations: TenantRelation[]): void {
    this.tenantRelationsSubject.next(tenantRelations);
  }

  setCurrentUser(user: User): void {
    if (this.userSubject.value !== user) {
      this.userSubject.next(user);
    }
  }

  getCurrentTenant(): Tenant {
    return this.tenantSubject.value;
  }

  getCurrentTenantRelations(): TenantRelation[] {
    return this.tenantRelationsSubject.value;
  }

  getCurrentUser(): User {
    return this.userSubject.value;
  }

  hasRole(tenantId: string, role: ROLE): boolean {
    if (this.getCurrentTenantRelations()) {
      const relation = find(this.getCurrentTenantRelations(), { tenantId });
      return relation && relation.hasRole(role);
    }
    return false;
  }
}
