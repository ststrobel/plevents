import { Component, Input, OnInit } from '@angular/core';
import { Tenant } from 'src/app/models/tenant';
import { TenantService } from 'src/app/services/tenant.service';
import { SubscriptionService } from 'src/app/services/subscription.service';
import { Subscription } from 'src/app/models/subscription';

@Component({
  selector: 'subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  @Input()
  tenant: Tenant;
  subscriptions: Subscription[] = null;

  constructor(
    private tenantService: TenantService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.subscriptionService.getSubscriptions(this.tenant.id).subscribe(
      (subscriptions: Subscription[]) => {
        this.subscriptions = subscriptions;
      },
      error => {
        console.error(error);
      }
    );
  }

  initializeNewSubscription(): void {
    this.subscriptionService
      .initializePayment({
        months: 1,
        tenantId: this.tenant.id,
        paid: null,
      })
      .subscribe(
        (responseWithLink: any) => {
          // we received a link to the PSP. open a new browser window / tab
          console.log(responseWithLink);
          window.open(responseWithLink.paymentLink, '_blank');
        },
        error => {
          console.error(error);
        }
      );
  }
}
