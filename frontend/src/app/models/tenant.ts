import { TenantI } from '../../../../common/tenant';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';

export class Tenant implements TenantI {
  id?: string;
  name: string;
  logo: string;
  path: string;
  consentText: string;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TenantAdapter implements Adapter<Tenant> {
  adapt(item: any): Tenant {
    const t = new Tenant(item.name, item.path);
    t.id = item.id;
    t.consentText = item.consentText;
    if (item.logo) {
      t.logo = item.logo;
    }
    return t;
  }
}
