import { DynamoDB } from 'aws-sdk';
import DUE from 'dynamodb-update-expression';

import LogService from '../services/log-service';
import Customer from '../domain/customer';

/**
 * The customer repository
 */
export default class CustomerRepo {
  /**
   * Constructs a new customer repository
   * @param {string} param.tableName The customer table name
   * @param {DynamoDB.DocumentClient} [param.dynamoDb] The Dynamo DB document client
   * @param {LogService} [param.log] The log service
   */
  /* istanbul ignore next */
  constructor({
    tableName,
    dynamoDb,
    log,
  } = {}) {
    this.tableName = tableName || process.env.DYNAMODB_CUSTOMER_TABLENAME;
    this.dynamoDb = dynamoDb || new DynamoDB.DocumentClient();
    this.log = log || new LogService();
  }

  /**
   * Fetch all items
   * @returns {Promise<Customer[]>}
   */
  async getAll() {
    // TODO: Limit is just for now until we implement ElasticSearch in front of DynamoDB
    const payload = { TableName: this.tableName, Limit: 100 };
    const { Items } = await this.dynamoDb.scan(payload).promise();
    const customers = await Promise.all(Items.map(item => this.hydrateCustomer(item)));

    return customers;
  }

  /**
   * Finds a customer by ID
   * @param {string} id The customer ID
   * @returns {Promise<Customer>}
   */
  async find(id) {
    if (!id) {
      throw new Error('ID is required');
    }

    const payload = { TableName: this.tableName, Key: { id } };
    const { Item } = await this.dynamoDb.get(payload).promise();
    const result = await this.hydrateCustomer(Item);

    return result;
  }

  /**
   * Deletes a customer and all their attributes (best effort) by ID
   * @param {string} id The customer ID
   */
  async delete(id) {
    if (!id) {
      throw new Error('ID is required');
    }

    const customer = await this.find(id);

    if (!customer) {
      throw new Error('No customer found');
    }

    const payload = { TableName: this.tableName, Key: { id } };

    this.log.info('Deleting customer', payload);

    await this.dynamoDb.delete(payload).promise();
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

    const existingCustomer = await this.find(id, false);

    if (existingCustomer) {
      const updateExpression = DUE.getUpdateExpression(existingCustomer, customer);
      const payload = {
        TableName: this.tableName,
        Key: { id },
        ...updateExpression,
      };

      this.log.info('Updating existing customer', payload);

      await this.dynamoDb.update(payload).promise();
    } else {
      const updateExpression = DUE.getUpdateExpression({ id }, customer);
      const payload = {
        TableName: this.tableName,
        Key: { id },
        ...updateExpression,
      };

      this.log.info('Creating new customer', payload);

      await this.dynamoDb.update(payload).promise();
    }
  }

  /**
   * Hydrate Customer
   * @param {Object} item Item from DB
   * @return {Customer|undefined}
   */
  // eslint-disable-next-line class-methods-use-this
  async hydrateCustomer(item) {
    let result;

    if (item) {
      result = new Customer({ ...item });
    }

    return result;
  }
}
