import * as express from 'express';
import { ROLE } from '../../../common/tenant-relation';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { PaymentService } from '../services/payment.service';
const dotenv = require('dotenv');
dotenv.config();

export class PaymentController {
  public static register(app: express.Application): void {
    // this will initialize a payment request
    app.post(
      '/secure/payment/tenants/:tenantId',
      tenantCorrelationHandler(ROLE.OWNER),
      async (request, response) => {
        const paymentLink = await PaymentService.get().initiate(
          request.params.tenantId,
          request.body.months
        );
        response.status(200).send({ paymentLink });
      }
    );

    // this will handle the webhook callback from adyen
    app.post('/payment/callback', async (request, response) => {
      // check that the request comes from adyen by checking the basic auth credentials
      if (
        request.get('Authorization') &&
        request.get('Authorization').startsWith('Basic ')
      ) {
        const base64Credentials = request.get('Authorization').split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString(
          'ascii'
        );
        if (
          credentials ===
          `${process.env.ADYEN_USER}:${process.env.ADYEN_PASSWORD}`
        ) {
          // request is authorized, continue with the business logic to active a tenant
          PaymentService.get().handleCallback(request.body);
          response.sendStatus(202);
        } else {
          response.sendStatus(401);
        }
      } else {
        response.sendStatus(401);
      }
    });
  }
}
