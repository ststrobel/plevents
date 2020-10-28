import { Component, Input, OnInit } from '@angular/core';
import { Tenant } from 'src/app/models/tenant';
import { SubscriptionService } from 'src/app/services/subscription.service';
import { Subscription } from 'src/app/models/subscription';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { sortBy } from 'lodash';

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

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.subscriptionService.getSubscriptions(this.tenant.id).subscribe(
      (subscriptions: Subscription[]) => {
        this.subscriptions = subscriptions;
        // sort the subscriptions by creation date
        this.subscriptions = sortBy(this.subscriptions, ['createdAt']);
      },
      error => {
        console.error(error);
      }
    );
  }

  initializeNewSubscription(): void {
    this.subscriptionService
      .initializePayment({
        months: parseInt(this.subscriptionForm.get('months').value),
        tenantId: this.tenant.id,
        paid: null,
      })
      .subscribe(
        (responseWithLink: any) => {
          // we received a link to the PSP. open a new browser window / tab
          window.open(responseWithLink.paymentLink, '_blank');
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
