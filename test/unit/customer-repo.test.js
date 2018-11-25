import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import Customer from '../../src/domain/customer';
import CustomerRepo from '../../src/repos/customer-repo';

chai.use(chaiAsPromised);

describe('CustomerRepo', () => {
  const tableName = 'customer';
  const createCustomer = options => new Customer({ ...options });
  const createRepo = options => new CustomerRepo({
    tableName,
    customerAttributeRepo: {
      delete: sinon.stub().resolves(),
      save: sinon.stub().resolves(),
    },
    dynamoDb: {
      get: sinon.stub().returns({ promise: () => Promise.resolve({ Item: createCustomer({ id: options && options.customerId }) }) }),
      update: sinon.stub().returns({ promise: () => Promise.resolve() }),
      delete: sinon.stub().returns({ promise: () => Promise.resolve() }),
      scan: sinon.stub().returns({ promise: () => Promise.resolve() }),
    },
    log: {
      info: sinon.stub(),
      error: sinon.stub(),
    },
    ...options,
  });

  describe('getAll', () => {
    describe('get all customer limited by 100', () => {
      const customer1 = createCustomer();
      const customer2 = createCustomer();
      const promise = sinon.stub().resolves({
        Items: [
          customer1,
          customer2,
        ],
      });
      const scan = sinon.stub().returns({ promise });
      const repo = createRepo({ dynamoDb: { scan } });
      let result;

      before(async () => {
        result = await repo.getAll();
      });

      it('dynamoDb.scan should be called with correct payload', () =>
        expect(scan).to.be.calledWith({ TableName: tableName, Limit: 100 }));

      it('dynamoDb.scan.promise should be called', () => expect(promise).to.be.calledOnce);

      it('result should of instance of Customer', () => expect(result).to.be.instanceof(Array));

      it('result should return matching customer1 as first item', () => expect(result[0]).to.eql(customer1));
      it('result should return matching customer2 as second item', () => expect(result[1]).to.eql(customer2));
    });

    describe('item not found', () => {
      const repo = createRepo();
      let result;

      before(async () => {
        repo.dynamoDb.scan.returns({ promise: () => Promise.resolve({ Items: [] }) });
        result = await repo.getAll();
      });

      it('results should not exist', () => expect(result).to.be.empty);
    });
  });

  describe('find', () => {
    describe('invalid args', () => {
      const repo = createRepo();

      it('invalid id should throw exception', () =>
        expect(repo.find()).to.be.rejectedWith(Error, 'ID is required'));
    });

    describe('valid args', () => {
      const customer = createCustomer();
      const promise = sinon.stub().resolves({ Item: customer });
      const get = sinon.stub().returns({ promise });
      const repo = createRepo({ dynamoDb: { get } });
      const { id } = customer;
      let result;

      before(async () => {
        result = await repo.find(id);
      });

      it('dynamoDb.get should be called with correct payload', () =>
        expect(get.calledWith({ TableName: tableName, Key: { id } })).to.be.true);

      it('dynamoDb.get.promise should be called', () => expect(promise.calledOnce).to.be.true);

      it('result should of instance of Customer', () => expect(result).to.be.instanceof(Customer));

      it('result should return matching customer', () => expect(result).to.eql(customer));
    });

    describe('item not found', () => {
      const repo = createRepo();
      let result;

      before(async () => {
        repo.dynamoDb.get.returns({ promise: () => Promise.resolve({ Item: undefined }) });
        result = await repo.find('id');
      });

      it('result should not exist', () => expect(result).to.not.exist);
    });
  });

  describe('delete', () => {
    describe('invalid args', () => {
      const repo = createRepo();

      it('invalid id should throw error', () =>
        expect(repo.delete()).to.be.rejectedWith(Error, 'ID is required'));

      it('no existing customer should throw error', () => {
        sinon.stub(repo, 'find').resolves(undefined);
        return expect(repo.delete('id')).be.rejectedWith(Error, 'No customer found');
      });
    });

    describe('valid args', () => {
      const repo = createRepo();

      before(async () => {
        await repo.delete('id');
      });

      it('dynamoDb.delete should be called with correct payload', () =>
        expect(repo.dynamoDb.delete.calledWith({
          TableName: 'customer',
          Key: { id: 'id' },
        })).to.be.true);
    });
  });

  describe('save', () => {
    describe('invalid args', () => {
      const repo = createRepo();

      it('undefined customer should throw error', () =>
        expect(repo.save()).to.be.rejectedWith(Error, 'Customer is required'));

      it('undefined customer id should throw error', () =>
        expect(repo.save({})).to.be.rejectedWith(Error, 'Customer ID is required'));
    });

    describe('valid args', () => {
      const repo = createRepo();
      const customer = new Customer({ });

      before(async () => {
        sinon.spy(repo, 'find');
        await repo.save(customer);
      });

      it('find should be called with customer id', () =>
        expect(repo.find.calledWith(customer.id, false)).to.be.true);
    });

    describe('update existing customer', () => {
      const repo = createRepo();
      const existingCustomer = new Customer();
      const updatedCustomer = new Customer({ ...existingCustomer, updatedDateTime: 'updated' });

      before(async () => {
        sinon.stub(repo, 'find').resolves(existingCustomer);
        await repo.save(updatedCustomer);
      });

      it('dynamoDb.update should be called once', () =>
        expect(repo.dynamoDb.update.calledOnce).to.be.true);
    });

    describe('creating new customer', () => {
      const repo = createRepo();
      const customer = new Customer({ name: 'Weiss' });

      before(async () => {
        sinon.stub(repo, 'find').resolves();
        await repo.save(customer);
      });

      it('dynamoDb.update should be called once', () =>
        expect(repo.dynamoDb.update.calledOnce).to.be.true);

      it('dynamoDb.update should be called correct payload', () =>
        expect(repo.dynamoDb.update.calledWith({
          TableName: 'customer',
          Key: { id: customer.id },
          UpdateExpression: 'SET #version = :version, #createdDateTime = :createdDateTime, #name = :name',
          ExpressionAttributeNames: {
            '#version': 'version',
            '#createdDateTime': 'createdDateTime',
            '#name': 'name',
          },
          ExpressionAttributeValues: {
            ':version': customer.version,
            ':createdDateTime': customer.createdDateTime,
            ':name': customer.name,
          },
        })).to.be.true);
    });
  });
});
