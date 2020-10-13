import { TenantRelationI } from '../../../../common/tenant-relation';
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
    if (item.user) {
      relation.user = this.userAdapter.adapt(item.user);
    }
    if (item.tenant) {
      relation.tenant = this.tenantAdapter.adapt(item.tenant);
    }
    return relation;
  }
}
