import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { Tenant, TenantAdapter } from './tenant';

export class Invitation {
  id: string;
  email: string;
  tenantId: string;
  tenant: Tenant;
}

@Injectable({
  providedIn: 'root',
})
export class InvitationAdapter implements Adapter<Invitation> {
  constructor(private tenantAdapter: TenantAdapter) {}
  adapt(item: any): Invitation {
    const invitation = new Invitation();
    invitation.id = item.id;
    invitation.email = item.email;
    invitation.tenantId = item.tenantId;
    if (item.tenant) {
      invitation.tenant = this.tenantAdapter.adapt(item.tenant);
    }
    return invitation;
  }
}
