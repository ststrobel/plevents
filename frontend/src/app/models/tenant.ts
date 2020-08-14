import { TenantI } from "../../../../common/tenant";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";

export class Tenant implements TenantI {
  id?: number;
  name: string;
  logo: string;
  path: string;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }
}

@Injectable({
  providedIn: "root",
})
export class TenantAdapter implements Adapter<Tenant> {
  adapt(item: any): Tenant {
    const t = new Tenant(item.name, item.path);
    if (item.id) {
      t.id = item.id;
    }
    if (item.logo) {
      t.logo = item.logo;
    }
    return t;
  }
}
