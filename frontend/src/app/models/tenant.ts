import { TenantI } from '../../../../common/tenant';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { DomSanitizer } from '@angular/platform-browser';

export class Tenant implements TenantI {
  id?: string;
  name: string;
  logo: string;
  path: string;
  consentTeaser1: string;
  consentText1: string;
  consentTeaser2: string;
  consentText2: string;

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
    t.consentTeaser1 = item.consentTeaser1;
    t.consentText1 = item.consentText1;
    t.consentTeaser2 = item.consentTeaser2;
    t.consentText2 = item.consentText2;
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
