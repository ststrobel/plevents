import * as express from 'express';
import { ROLE } from '../../../common/tenant-relation';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { Subscription } from '../models/subscription';

export class PaymentController {
  public static register(app: express.Application): void {
    // this will initialize a payment request
    app.get(
      '/secure/tenants/:tenantId/subscriptions',
      tenantCorrelationHandler(ROLE.OWNER),
      async (request, response) => {
        const subscriptions = await Subscription.find({
          where: { tenantId: request.params.tenantId },
        });
        response.status(200).send(subscriptions);
      }
    );

    // this will initialize a payment request
    app.post(
      '/secure/tenants/:tenantId/subscriptions',
      tenantCorrelationHandler(ROLE.OWNER),
      async (request, response) => {
        response.status(400).send({ error: 'not implemented' });
      }
    );
  }
}
