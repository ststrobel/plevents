import moment from 'moment';
import { Subscription } from '../models/subscription';

const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');

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

  async initiate(tenantId: string, months: number): Promise<string> {
    // do some sanity check
    if (months < 1) {
      throw new Error('invalid number of months specified (' + months + ')');
    }
    const newSubscription = new Subscription();
    newSubscription.tenantId = tenantId;
    newSubscription.months = months;
    newSubscription.pricePerMonth = parseFloat(process.env.PRICE_PER_MONTH);
    await newSubscription.save();
    // now let's reach out to adyen to generate a unique payment URL to be sent to the user
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': `${process.env.ADYEN_API_KEY}`,
      },
    };
    const response = await axios
      .post(
        `${process.env.ADYEN_PAYMENT_URL}`,
        {
          reference: `${newSubscription.id}`,
          amount: {
            value: newSubscription.months * newSubscription.pricePerMonth * 100,
            currency: 'EUR',
          },
          shopperReference: `${newSubscription.tenantId}`,
          description: `plevents Lizenz für ${newSubscription.months} Monate`,
          countryCode: 'DE',
          merchantAccount: `${process.env.ADYEN_MERCHANT_CODE}`,
          shopperLocale: 'de-DE',
        },
        axiosConfig
      )
      .then(res => res.data);
    return response.url;
  }

  async handleCallback(adyenBody: any): Promise<void> {
    try {
      console.log('received adyen callback:', JSON.stringify(adyenBody));
      // see https://docs.adyen.com/development-resources/webhooks/understand-notifications
      const reference =
        adyenBody.notificationItems[0].NotificationRequestItem
          .merchantReference;
      const subscription = await Subscription.findOneOrFail(reference, {
        relations: ['tenant'],
      });
      if (
        adyenBody.notificationItems[0].NotificationRequestItem.success ===
        'true'
      ) {
        // payment was successful, set the active flag on the tenant
        subscription.tenant.active = true;
        // calculate the date until when the subscription is valid
        const until = moment().add(subscription.months, 'months').endOf('day');
        subscription.tenant.subscriptionUntil = until.toDate();
      } else {
        // do nothing for now
      }
    } catch (e) {
      console.error(e);
    }
  }
}
