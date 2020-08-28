import { TenantI } from '../../../../common/tenant';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { DomSanitizer } from '@angular/platform-browser';

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
  constructor(private sanitizer: DomSanitizer) {}
  adapt(item: any): Tenant {
    const t = new Tenant(item.name, item.path);
    t.id = item.id;
    t.consentText = item.consentText;
    if (item.logo && item.logo.length > 0) {
      t.logo = this.sanitizer.bypassSecurityTrustResourceUrl(
        item.logo
      ) as string;
    } else {
      t.logo = null;
    }
    return t;
  }
}
