import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Subscription, SubscriptionAdapter } from '../models/subscription';
import { SubscriptionI } from '../../../../common/subscription';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private http: HttpClient, private adapter: SubscriptionAdapter) {}

  getSubscriptions(tenantId: string): Observable<Subscription[]> {
    return this.http
      .get(`${environment.apiUrl}/secure/tenants/${tenantId}/subscriptions`)
      .pipe(
        // Adapt the raw items
        map((data: any[]) => data.map(item => this.adapter.adapt(item)))
      );
  }

  initializePayment(subscription: SubscriptionI): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/secure/tenants/${subscription.tenantId}/subscriptions`,
      subscription
    );
  }
}
