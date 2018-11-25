import moment from 'moment';

import Customer from '../domain/customer';
import CustomerRepo from '../repos/customer-repo';
import LogService from './log-service';
import Response404Exception from '../exceptions/response-404-exception';

export default class CustomerService {
  /**
   * Constructor
   * @param {Object} param
   */
  /* istanbul ignore next */
  constructor({
    log, customerRepo,
  } = {}) {
    this.log = log || new LogService();
    this.customerRepo = customerRepo || new CustomerRepo({ log: this.log });
  }

  /**
   * Create Customer from CustomerModel
   * @param {CustomerModel} model
   */
  async create(model) {
    if (!model) {
      throw new Error('Customer model is required');
    }

    const { id, name } = model;

    if (id) {
      const existingCustomer = await this.customerRepo.find(id);

      if (existingCustomer) {
        throw new Error('Customer already exists', id);
      }
    }

    const customer = new Customer({ id, name });
    const validation = Customer.CONSTRAINTS.validate(customer);

    if (validation.error) {
      throw validation.error;
    }

    this.log.info('Creating customer', customer);
    await this.customerRepo.save(customer);

    return customer;
  }

  /**
   * Update existing Customer from CustomerModel
   * @param {CustomerModel} model
   */
  async update(model) {
    if (!model) {
      throw new Error('Customer model is required');
    }

    const { id } = model;
    const customer = await this.customerRepo.find(id);

    if (!customer) {
      throw new Response404Exception('Customer not found');
    }

    customer.updatedDateTime = moment.utc().format();

    this.log.info('Updating customer', customer);
    await this.customerRepo.save(customer);

    return customer;
  }
}
