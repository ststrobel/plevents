import { UserI } from "../../../../common/user";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";
import { Tenant } from "./tenant";

export class User implements UserI {
  id: number;
  tenantId: number;
  email: string;
  name: string;
  password: string;
  authdata?: string;
  active: boolean;

  constructor(email: string) {
    this.email = email;
  }
}

@Injectable({
  providedIn: "root",
})
export class UserAdapter implements Adapter<User> {
  adapt(item: any): User {
    const u = new User(item.email);
    u.id = item.id;
    u.name = item.name;
    u.tenantId = item.tenantId;
    u.active = item.active;
    return u;
  }
}
