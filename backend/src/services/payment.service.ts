// Set your secret key. Remember to switch to your live secret key in production!

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
  async initiateSubscription(tenant: Tenant, email: string): Promise<string> {
    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.
    try {
      // first, check if the tenant already has a stripe account. if not, create one first
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
            },
          ],
          // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
          // the actual Session ID is returned in the query parameter when your customer
          // is redirected to the success page.
          success_url: `${process.env.DOMAIN}/${tenant.path}/${ROUTES.TENANT_MANAGEMENT}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.DOMAIN}/${tenant.path}/${ROUTES.TENANT_MANAGEMENT}`,
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
          tenant.save();
        });
        break;
      default:
        console.error(`Unhandled stripe event type ${event.type}`);
    }
  }
}
