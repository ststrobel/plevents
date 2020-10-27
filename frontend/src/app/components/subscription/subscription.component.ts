import { Component, Input, OnInit } from '@angular/core';
import { Tenant } from 'src/app/models/tenant';
import { TenantService } from 'src/app/services/tenant.service';

@Component({
  selector: 'subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  @Input()
  tenant: Tenant;

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {}
}
