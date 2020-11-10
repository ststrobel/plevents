// Set your secret key. Remember to switch to your live secret key in production!

import moment from 'moment';
import { getConnection } from 'typeorm';
import { ROUTES } from '../../../common/frontend.routes';
import { Tenant } from '../models/tenant';

// See your keys here: https://dashboard.stripe.com/account/apikey
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

export class PaymentService {
  private static singleton: PaymentService = null;

  /**
   * get the service instance
   */
  static get(): PaymentService {
    if (PaymentService.singleton === null) {
      PaymentService.singleton = new PaymentService();
    }
    return PaymentService.singleton;
  }

  /**
   * initiates a new subscription for a given tenant and returns the stripe session ID
   */
  async initiateSubscription(tenantId: string, email: string): Promise<string> {
    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.
    try {
      // first, check if the tenant already has a stripe account. if not, create one first
      const tenant = await getConnection()
        .createQueryBuilder()
        .select('tenant')
        .from(Tenant, 'tenant')
        .where(`id = '${tenantId}'`)
        .addSelect('tenant.stripeUserId')
        .getOne();
      if (!tenant.stripeUserId) {
        tenant.stripeUserId = (await stripe.customers.create()).id;
        await tenant.save();
      }
      // next, create a new subscription for our user
      const stripeSessionID = (
        await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer: tenant.stripeUserId,
          line_items: [
            {
              price: process.env.STRIPE_PRICE_ID,
              quantity: 1,
              tax_rates: [process.env.STRIPE_VAT_ID],
            },
          ],
          // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
          // the actual Session ID is returned in the query parameter when your customer
          // is redirected to the success page.
          success_url: `${process.env.DOMAIN}/${ROUTES.TENANT_PREFIX}/${tenant.path}/${ROUTES.TENANT_MANAGEMENT}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.DOMAIN}/${ROUTES.TENANT_PREFIX}/${tenant.path}/${ROUTES.TENANT_MANAGEMENT}`,
        })
      ).id;
      return stripeSessionID;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  handleStripeCallback(event: any): void {
    // Handle the event from stripe
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // the payment was done - set the status of the tenant to 'active'
        Tenant.findOneOrFail({
          where: { stripeUserId: event.data.object.customer },
        }).then((tenant: Tenant) => {
          tenant.active = true;
          tenant.subscriptionUntil = null;
          tenant.save();
        });
        break;
      case 'customer.subscription.deleted':
        // a tenant has ended its subscription. set the valid to date
        const validUntil = moment.unix(event.data.object.current_period_end);
        validUntil.hours(23).minutes(59).seconds(59);
        Tenant.findOneOrFail({
          where: { stripeUserId: event.data.object.customer },
        }).then((tenant: Tenant) => {
          tenant.subscriptionUntil = validUntil.toDate();
          tenant.save();
        });
        break;
    }
  }

  async generateLinkToStripCustomerPortal(tenantId: string): Promise<string> {
    const tenant = await getConnection()
      .createQueryBuilder()
      .select('tenant')
      .from(Tenant, 'tenant')
      .where(`id = '${tenantId}'`)
      .addSelect('tenant.stripeUserId')
      .getOne();
    if (!tenant.stripeUserId) {
      return null;
    }
    return (
      await stripe.billingPortal.sessions.create({
        customer: tenant.stripeUserId,
        return_url: `${process.env.DOMAIN}/${ROUTES.TENANT_PREFIX}/${tenant.path}/${ROUTES.TENANT_MANAGEMENT}`,
      })
    ).url;
  }
}
