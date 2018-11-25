import { expect } from 'chai';

import Customer from '../../src/domain/customer';

describe('Customer', () => {
  describe('Constraints', () => {
    it('Valid customer should not produce errors', () =>
      expect(Customer.CONSTRAINTS.validate(new Customer({ name: 'Mark' })).error).to.be.null);

    it('Invalid customer should produce errors', () =>
      expect(Customer.CONSTRAINTS.validate(new Customer({ id: 'undefined' })).error).to.exist);
  });

  describe('toJSON', () => {
    it('should return all own properties and attributes', () => {
      const customerJson = new Customer({
        name: 'Imad',
      }).toJSON();

      expect(customerJson).to.have.property('id');
      expect(customerJson).to.have.property('name');
    });
  });
});
