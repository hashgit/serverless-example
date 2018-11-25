import joi from 'joi';

/**
 * @swagger
 * definitions:
 *   CustomerModel:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: array
 */

export default class CustomerModel {
  /* istanbul ignore next */
  constructor({
    id,
    name,
  } = {}) {
    this.id = id;
    this.name = name;
  }

  // This is being used in controller which we don't unit test
  /* istanbul ignore next */
  static get CONSTRAINTS() {
    return joi.object({
      id: joi.string(),
      name: joi.string(),
    });
  }
}
