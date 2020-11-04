import { TenantI } from './tenant';

export interface SubscriptionI {
  id?: string;
  tenant?: TenantI;
  tenantId: string;
  pricePerMonth?: number;
  paid: Date;
  createdAt?: Date;
}
