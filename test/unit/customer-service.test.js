import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import Customer from '../../src/domain/customer';
import CustomerService from '../../src/services/customer-service';
import CustomerModel from '../../src/domain/customer-model';
import Response404Exception from '../../src/exceptions/response-404-exception';

chai.use(chaiAsPromised);

describe('CustomerService', () => {
  const createCustomer = options => new Customer(options);
  const createCustomerModel = options => new CustomerModel(options);
  const createService = options => new CustomerService({
    customerRepo: {
      save: sinon.stub().resolves(),
      find: sinon.stub(),
    },
    log: {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
    },
    ...options,
  });

  describe('create', () => {
    describe('creates Customer from a CustomerModel without ID', () => {
      const model = createCustomerModel({ name: 'Andy' });
      const service = createService();

      let result;

      before(async () => {
        result = await service.create(model);
      });

      it('should not call repository find() because ID is not provided', () =>
        expect(service.customerRepo.find).to.have.not.been.called);
      it('should call repository save() once', () =>
        expect(service.customerRepo.save).to.have.been.calledOnce);
      it('result should have value', () =>
        expect(result).to.be.not.null);
    });

    describe('creates Customer from a CustomerModel with ID', () => {
      const model = createCustomerModel({ id: '9f5075ef-bf2e-4960-a0ff-8fe50951d1e9', name: 'Andy' });
      const service = createService();

      let result;

      before(async () => {
        service.customerRepo.find.returns(Promise.resolve());
        result = await service.create(model);
      });

      it('should call repository find() because ID is not provided', () =>
        expect(service.customerRepo.find).to.have.been.calledOnce);
      it('should call repository save() once', () =>
        expect(service.customerRepo.save).to.have.been.calledOnce);
      it('should return newly created customer with provided ID', () =>
        expect(result.id).to.equal(model.id));
      it('result should have value', () =>
        expect(result).to.be.not.null);
    });

    describe('finds a existing Customer for CustomerModel ID', () => {
      const model = createCustomerModel({ id: '111', name: 'Andy' });
      const service = createService();

      before(async () => {
        service.customerRepo.find.returns(Promise.resolve(createCustomer({ id: '111', name: 'Andy' })));
      });

      it('should throw exception because customer exists', () =>
        expect(service.create(model)).to.be.rejectedWith(Error, 'Customer already exists'));
    });

    describe('throws an Error if CustomerModel is missing', () => {
      const service = createService();

      it('should throw exception because CustomerModel is missing', () =>
        expect(service.create()).to.be.rejectedWith(Error, 'Customer model is required'));
    });
  });

  describe('update', () => {
    describe('updates Customer from a CustomerModel', () => {
      const model = createCustomerModel({ id: '7da92c68-a145-4942-932c-53f3d5e265c3', name: 'Andy' });
      const service = createService();

      let result;

      before(async () => {
        service.customerRepo.find.returns(Promise.resolve(createCustomer({ id: '7da92c68-a145-4942-932c-53f3d5e265c3', name: 'Andy' })));
        result = await service.update(model);
      });

      it('should call repository find() to lookup customer', () =>
        expect(service.customerRepo.find).to.have.been.calledOnce);
      it('should call repository update() once with the custoer', () =>
        expect(service.customerRepo.save).to.have.been.calledOnce);
      it('result should have value', () =>
        expect(result).to.be.not.null);
    });

    describe('does not find existing Customer for CustomerModel ID', () => {
      const model = createCustomerModel({ id: '7da92c68-a145-4942-932c-53f3d5e265c3', name: 'Andy' });
      const service = createService();

      before(async () => {
        service.customerRepo.find.returns(Promise.resolve());
      });

      it('should throw exception because customer does not exist', () =>
        expect(service.update(model)).to.be.rejectedWith(Response404Exception, 'Customer not found'));
    });

    describe('throws an Error if CustomerModel is missing', () => {
      const service = createService();

      it('should throw exception because CustomerModel is missing', () =>
        expect(service.update()).to.be.rejectedWith(Error, 'Customer model is required'));
    });
  });
});
