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
}
