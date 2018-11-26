/* istanbul ignore file */
import _ from 'lodash';

import LogService from '../services/log-service';
import Customer from '../domain/customer';

/**
 * The customer repository
 */
export default class CustomerRepoMock {
  /**
   * Constructs a new customer repository
   * @param {string} param.tableName The customer table name
   * @param {LogService} [param.log] The log service
   */
  /* istanbul ignore next */
  constructor({
    tableName,
    log,
    storage,
  } = {}) {
    this.tableName = tableName || process.env.DYNAMODB_CUSTOMER_TABLENAME;
    this.storage = storage || [];
    this.log = log || new LogService();
    this.log.info(this.storage);
  }

  /**
   * Fetch all items
   * @returns {Promise<Customer[]>}
   */
  /* istanbul ignore next */
  async getAll() {
    const Items = this.storage;
    return Items;
  }

  /**
   * Finds a customer by ID
   * @param {string} id The customer ID
   * @returns {Promise<Customer>}
   */
  /* istanbul ignore next */
  async find(id) {
    if (!id) {
      throw new Error('ID is required');
    }

    const Item = _.find(this.storage, ['id', id]);
    return Item;
  }

  /**
   * Deletes a customer and all their attributes (best effort) by ID
   * @param {string} id The customer ID
   */
  /* istanbul ignore next */
  async delete(id) {
    if (!id) {
      throw new Error('ID is required');
    }

    const removedCustomers = _.remove(this.storage, c => c.id === id);

    if (removedCustomers.length === 0) {
      throw new Error('No customer found');
    }
  }

  /**
   * Creates or updates a customer
   * @param {Customer} customer The customer
   */
  async save(customer) {
    if (!customer) {
      throw new Error('Customer is required');
    }

    const { id } = customer;

    if (!id) {
      throw new Error('Customer ID is required');
    }

    const existingCustomerIndex = _.findIndex(this.storage, ['id', id]);

    if (existingCustomerIndex > -1) {
      this.log.info('Updating existing customer', customer);
      this.storage[existingCustomerIndex] = new Customer(customer);
    } else {
      this.log.info('Creating new customer', customer);
      this.storage.push(new Customer(customer));
    }
  }
}
