export interface UserI {
  id?: string;
  tenantId?: string;
  email: string;
  name: string;
  password: string;
  authdata?: string;
  active: boolean;
}
