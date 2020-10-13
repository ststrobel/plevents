import { TenantI } from './tenant';
import { UserI } from './user';

export interface TenantRelationI {
  id: string;
  active: boolean;
  user?: UserI;
  userId: string;
  tenant?: TenantI;
  tenantId: string;
}
