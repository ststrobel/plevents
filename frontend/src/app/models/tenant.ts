import { TenantI } from '../../../../common/tenant';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';

export class Tenant implements TenantI {
  id?: string;
  name: string;
  active: boolean;
  logo: string;
  path: string;
  consentTeaser1: string;
  consentText1: string;
  consentTeaser2: string;
  consentText2: string;
  color: string;
  subscriptionUntil: Date;
  stripeUserId?: string;
  activeUntil?: Date;
  get colorDarkened(): string {
    return shadeColor(this.color, -15);
  }

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
    t.active = item.active;
    t.consentTeaser2 = item.consentTeaser2;
    t.consentText2 = item.consentText2;
    t.color = item.color;
    t.stripeUserId = item.stripeUserId;
    if (item.activeUntil) {
      t.activeUntil = moment(item.activeUntil).toDate();
    }
    if (item.logo && item.logo.length > 0) {
      t.logo = this.sanitizer.bypassSecurityTrustResourceUrl(
        item.logo
      ) as string;
    } else {
      t.logo = null;
    }
    if (item.subscriptionUntil) {
      t.subscriptionUntil = moment(item.subscriptionUntil).toDate();
    }
    return t;
  }
}

function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(`${(R * (100 + percent)) / 100}`);
  G = parseInt(`${(G * (100 + percent)) / 100}`);
  B = parseInt(`${(B * (100 + percent)) / 100}`);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  let RR = R.toString(16).length == 1 ? '0' + R.toString(16) : R.toString(16);
  let GG = G.toString(16).length == 1 ? '0' + G.toString(16) : G.toString(16);
  let BB = B.toString(16).length == 1 ? '0' + B.toString(16) : B.toString(16);

  return '#' + RR + GG + BB;
}
