import { TenantI } from './tenant';
import { UserI } from './user';

export enum ROLE {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export interface TenantRelationI {
  id: string;
  active: boolean;
  user?: UserI;
  userId: string;
  tenant?: TenantI;
  tenantId: string;
  role: ROLE;
}
