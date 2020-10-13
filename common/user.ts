import { TenantI } from './tenant';

export interface UserI {
  id?: string;
  tenants?: TenantI[];
  email: string;
  name: string;
  password: string;
  authdata?: string;
  active: boolean;
}
