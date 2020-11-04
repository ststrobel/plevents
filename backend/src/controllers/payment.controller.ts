import * as express from 'express';
import { getConnection } from 'typeorm';
import { ROUTES } from '../../../common/frontend.routes';
import { ROLE } from '../../../common/tenant-relation';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { Tenant } from '../models/tenant';
import { PaymentService } from '../services/payment.service';
import { UserService } from '../services/user.service';
// See your keys here: https://dashboard.stripe.com/account/apikey
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require('body-parser');

export class PaymentController {
  public static register(app: express.Application): void {
    // this will initialize a payment request
    app.post(
      '/secure/tenants/:tenantId/subscriptions',
      tenantCorrelationHandler(ROLE.OWNER),
      async (request, response) => {
        const tenant = await Tenant.findOneOrFail(request.params.tenantId);
        const stripeSessionID = await PaymentService.get().initiateSubscription(
          request.params.tenantId,
          UserService.username(request)
        );
        response.status(201).send({ stripeSessionID });
      }
    );

    // this will generate a link to the stripe customer portal (where users can manage payment and invoice data)
    app.get(
      '/secure/tenants/:tenantId/subscriptions',
      tenantCorrelationHandler(ROLE.OWNER),
      async (request, response) => {
        const link = await PaymentService.get().generateLinkToStripCustomerPortal(
          request.params.tenantId
        );
        response.status(200).send({ link: link });
      }
    );

    app.post(
      '/psp/webhook',
      bodyParser.raw({ type: 'application/json' }),
      (request, response) => {
        const sig = request.headers['stripe-signature'];
        let event: any;
        try {
          event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err) {
          return response.status(400).send(`Webhook Error: ${err.message}`);
        }
        PaymentService.get().handleStripeCallback(event);
        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
      }
    );
  }
}
