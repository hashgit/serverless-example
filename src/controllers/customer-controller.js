import express from 'express';
// Use mock repo
// import CustomerRepo from '../repos/customer-repo';
import CustomerRepoMock from '../repos/mock-customer-repo';
import CustomerService from '../services/customer-service';
import CustomerModel from '../domain/customer-model';

const router = new express.Router();

router.use((req, res, next) => {
  req.customerRepo = new CustomerRepoMock({ log: req.log, storage: req.app.get('storageMock') });
  req.customerService = new CustomerService({ customerRepo: req.customerRepo, log: req.log });
  next();
});

/**
 * @swagger
 * /{id}:
 *  get:
 *    tags:
 *      - Customer
 *    summary: Retrieve single Customer by its ID
 *    description: >
 *      Retrieve single Customer by its ID.
 *    security:
 *      - apiKeyAuthorization: []
 *    parameters:
 *      - name: id
 *        description: Specify a Customer ID for retrieval
 *        required: true
 *        in: path
 *        type: string
 *    responses:
 *      200:
 *        description: Customer retrieved
 *      400:
 *        description: The request was rejected - missing ID
 *      403:
 *        description: Forbidden - specify a valid x-api-key value
 *      404:
 *        description: Object not found
 *      500:
 *        description: Internal server error
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    req.log.warn('ID is required');
    return res.status(400).json({
      errors: [{
        title: 'Invalid request - missing ID',
      }],
    });
  }

  try {
    req.log.info(`Fetching customer by ID ${id}`);
    const customer = await req.customerRepo.find(id);

    if (customer) {
      return res.json({
        data: {
          type: 'customer',
          id: customer.id,
          attributes: customer,
        },
      });
    }

    req.log.warn('Customer not found', { id });
    return res.status(404).end();
  } catch (error) {
    req.log.error('Customer fetching by ID failed', error);
    return res.status(error.status || 500).json({
      errors: [{
        status: error.status || 500,
        title: error.message,
      }],
    });
  }
});

/**
 * @swagger
 * /:
 *  get:
 *    tags:
 *      - Customer
 *    summary: Return all customers or find Customers by params specified in query string
 *    description: >
 *      If no query param is provided it will fetch all customers others it will search for customers by matching the params sent in query string
 *    security:
 *      - apiKeyAuthorization: []
 *    parameters:
 *      - name: e
 *        in: query
 *        description: Email Unverified
 *        required: false
 *        type: string
 *        example: customer?e=sample_name@email.com
 *      - name: ev
 *        in: query
 *        description: Email Verified
 *        required: false
 *        type: string
 *    responses:
 *      200:
 *        description: Customer retrieved
 *      400:
 *        description: The request was rejected - incorrect query param
 *      403:
 *        description: Forbidden - specify a valid x-api-key value
 *      500:
 *        description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    // For now we are returning all customers from DB
    // /customer
    req.log.info('Fetching all customers');

    const customers = await req.customerRepo.getAll();
    return res.json({
      data: customers.map(customer => ({
        type: 'customer',
        id: customer.id,
        attributes: customer,
      })),
    });
  } catch (error) {
    req.log.error('Searching for customers failed', error);
    return res.status(error.status || 500).json({
      errors: [{
        status: error.status || 500,
        title: error.message,
      }],
    });
  }
});

/**
 * @swagger
 * /:
 *  post:
 *    security:
 *      - apiKeyAuthorization: []
 *    tags:
 *      - Customer
 *    summary: Create new Customer (and don't check for existing matches)
 *    description: >
 *      This API does "force create" of customer without checking of any existing matches of attributes in DB based.
 *      It reports failure if Customer ID already exists
 *    parameters:
 *      - name: body
 *        in: body
 *        description: Customer values
 *        required: true
 *        schema:
 *          $ref: '#/definitions/Customer'
 *    responses:
 *      204:
 *        description: Customer created
 *      400:
 *        description: The request was rejected - validation failed
 *      403:
 *        description: Forbidden - specify a valid x-api-key value
 *      500:
 *        description: Internal server error
 */
router.post('/', async (req, res) => {
  try {
    const model = new CustomerModel({ id: req.body.id, name: req.body.name });
    const validation = CustomerModel.CONSTRAINTS.validate(model);

    if (validation.error) {
      return res.status(400).json({
        errors: validation.error.details.map(({ message, type, context }) => ({
          code: type,
          title: message,
          meta: context,
        })),
      });
    }

    const customer = await req.customerService.create(model);
    req.log.info(req.app.locals.storageMock);
    return res.json({
      data: {
        type: 'customer',
        id: customer.id,
        attributes: customer,
      },
    });
  } catch (error) {
    req.log.error('Creating of Customer failed', error);
    return res.status(error.status || 500).json({
      errors: [{
        status: error.status || 500,
        title: error.message,
      }],
    });
  }
});

/**
 * @swagger
 * /:
 *  put:
 *    security:
 *      - apiKeyAuthorization: []
 *    tags:
 *      - Customer
 *    summary: Create or update existing Customer (check for existing matches)
 *    description: |
 *      If CustomerId is provided it will update the existing record (basic update) or throw error if Customer does not exist.
 *      If CustomerId is not provided the API tries to match the record to any existing Customer based on attributes.
 *      If a match is found and is above the required minimum points the API will update the Customer,
 *      otherwise will create a new Customer.
 *    parameters:
 *      - name: body
 *        in: body
 *        description: Customer values
 *        required: true
 *        schema:
 *          $ref: '#/definitions/Customer'
 *    responses:
 *      204:
 *        description: Customer created
 *      400:
 *        description: The request was rejected - validation failed
 *      403:
 *        description: Forbidden - specify a valid x-api-key value
 *      500:
 *        description: Internal server error
 */
router.put('/', async (req, res) => {
  try {
    const model = new CustomerModel({ id: req.body.id, name: req.body.name });
    const validation = CustomerModel.CONSTRAINTS.validate(model);

    if (validation.error) {
      return res.status(400).json({
        errors: validation.error.details.map(({ message, type, context }) => ({
          code: type,
          title: message,
          meta: context,
        })),
      });
    }

    const customer = await req.customerService.update(model);
    return res.json({
      data: {
        type: 'customer',
        id: customer.id,
        attributes: customer,
      },
    });
  } catch (error) {
    req.log.error('Customer update failed', error);
    return res.status(error.status || 500).json({
      errors: [{
        status: error.status || 500,
        title: error.message,
      }],
    });
  }
});

export default router;
