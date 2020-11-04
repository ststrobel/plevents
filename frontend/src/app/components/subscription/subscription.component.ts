import { Component, Input, OnInit } from '@angular/core';
import { Tenant } from 'src/app/models/tenant';
import { SubscriptionService } from 'src/app/services/subscription.service';
import { Subscription } from 'src/app/models/subscription';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { sortBy } from 'lodash';
import { environment } from 'src/environments/environment';
declare var Stripe: any;

@Component({
  selector: 'subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  @Input()
  tenant: Tenant;
  subscriptions: Subscription[] = null;
  subscriptionForm: FormGroup = new FormGroup({
    months: new FormControl(1, Validators.required),
  });
  linkToCustomerPortal: string = null;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.subscriptionService
      .getLinkToStripCustomerPortal(this.tenant.id)
      .subscribe(responseWithLink => {
        this.linkToCustomerPortal = responseWithLink.link;
      });
  }

  initializeSubscription(): void {
    this.subscriptionService
      .initializePayment({
        tenantId: this.tenant.id,
        paid: null,
      })
      .subscribe(
        (responseWithStripeSessionID: any) => {
          // we received a link to the PSP. open a new browser window / tab
          const stripe = Stripe(environment.stripePubKey);
          stripe
            .redirectToCheckout({
              sessionId: responseWithStripeSessionID.stripeSessionID,
            })
            .then(() => {
              console.log('success for stripe callback! :-)');
            });
        },
        error => {
          console.error(error);
        }
      );
  }

  moreMonths(): string {
    const months = parseInt(this.subscriptionForm.get('months').value);
    return (
      (months === 1 ? 'weiteren ' : 'weitere ') +
      (months === 1 ? 'Monat' : 'Monate') +
      ' kaufen.'
    );
  }

  subscriptionEndsSoon(): boolean {
    return (
      this.tenant.subscriptionUntil &&
      moment(this.tenant.subscriptionUntil).diff(moment(), 'days') <= 7
    );
  }
}
