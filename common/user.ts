export interface UserI {
  id?: number;
  tenantId?: number;
  email: string;
  name: string;
  password: string;
  authdata?: string;
  active: boolean;
}
