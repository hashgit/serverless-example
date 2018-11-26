// ignore this file because it is not being used
// it is only to demonstrate invokation of another micro service
/* istanbul ignore file */
import LogService from './log-service';

export default class LoyaltyService {
  /**
   * Constructor
   * @param {Object} param
   */
  constructor({
    log, loyaltyServiceEndpoint, loyaltyServiceApiKey,
  } = {}) {
    this.log = log || new LogService();
    this.loyaltyServiceEndpoint = loyaltyServiceEndpoint || process.env.LOYALTY_ENDPOINT;
    this.loyaltyServiceApiKey = loyaltyServiceApiKey || process.env.LOYALTY_API_KEY;
  }

  /**
   * Create loyalty membership for customer
   * @param {Customer} model
   */
  async create(model) {
    if (!model) {
      throw new Error('Customer object is required');
    }

    const { id } = model;

    const payload = {
      method: 'POST',
      uri: this.loyaltyServiceEndpoint,
      json: true,
      headers: {
        'x-api-key': this.loyaltyServiceApiKey,
        'x-correlation-id': this.log.cid,
      },
      body: {
        customerId: id,
      },
    };

    await this.client(payload);
  }
}
