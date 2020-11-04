import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { SubscriptionI } from '../../../../common/subscription';
import { TenantI } from '../../../../common/tenant';

export class Subscription implements SubscriptionI {
  id?: string;
  tenant?: TenantI;
  tenantId: string;
  pricePerMonth?: number;
  paid: Date = null;
  createdAt?: Date;

  constructor(item?: any) {
    if (item) {
      this.id = item.id;
      this.tenantId = item.tenantId;
      this.tenant = item.tenant;
      this.paid = item.paid;
      this.pricePerMonth = item.pricePerMonth;
      this.createdAt = item.createdAt;
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionAdapter implements Adapter<Subscription> {
  adapt(item: any): Subscription {
    return new Subscription(item);
  }
}
