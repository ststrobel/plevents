import { TenantI } from './tenant';

export interface SubscriptionI {
  id?: string;
  tenant?: TenantI;
  tenantId: string;
  months: number;
  pricePerMonth?: number;
  paid: Date;
}
