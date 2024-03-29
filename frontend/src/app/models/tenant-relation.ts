import { ROLE, TenantRelationI } from '../../../../common/tenant-relation';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { User, UserAdapter } from './user';
import { Tenant, TenantAdapter } from './tenant';

export class TenantRelation implements TenantRelationI {
  id: string;
  active: boolean;
  user?: User;
  userId: string;
  tenant?: Tenant;
  tenantId: string;
  role: ROLE;

  isOwner(): boolean {
    return this.role === ROLE.OWNER;
  }

  isAdmin(): boolean {
    return this.role === ROLE.OWNER || this.role === ROLE.ADMIN;
  }

  isMember(): boolean {
    return true;
  }

  hasRole(roleName: string): boolean {
    if (this.role === ROLE.OWNER) return true;
    if (this.role === ROLE.ADMIN && roleName !== ROLE.OWNER) return true;
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TenantRelationAdapter implements Adapter<TenantRelation> {
  constructor(
    private userAdapter: UserAdapter,
    private tenantAdapter: TenantAdapter
  ) {}
  adapt(item: any): TenantRelation {
    const relation = new TenantRelation();
    relation.id = item.id;
    relation.active = item.active;
    relation.userId = item.userId;
    relation.tenantId = item.tenantId;
    relation.role = item.role;
    if (item.user) {
      relation.user = this.userAdapter.adapt(item.user);
    }
    if (item.tenant) {
      relation.tenant = this.tenantAdapter.adapt(item.tenant);
    }
    return relation;
  }
}
