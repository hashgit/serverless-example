import joi from 'joi';
import moment from 'moment';
import uuidV4 from 'uuid/v4';

export default class Customer {
  /**
   * Constructor
   * @param {Object} param
   * @param {string} param.id
   * @param {string} param.version
   * @param {string} param.createdDateTime
   * @param {string} param.updatedDateTime
   * @param {string} param.name
   */
  constructor({
    id,
    version,
    createdDateTime,
    updatedDateTime,
    name,
  } = {}) {
    this.id = id || uuidV4();
    this.version = version || '2018-11-23';
    this.createdDateTime = createdDateTime || moment.utc().format();
    this.updatedDateTime = updatedDateTime;
    this.name = name;
  }

  /**
   * Get object version for JSON stringify
   * @return {Object}
   */
  toJSON() {
    return Object.assign({}, this);
  }

  /**
   * Get constraints
   * @return {Object}
   */
  static get CONSTRAINTS() {
    return joi.object({
      id: joi.string().guid().required(),
      version: joi.string().required(),
      createdDateTime: joi.date().required(),
      updatedDateTime: joi.date(),
      name: joi.string().required(),
    });
  }
}
