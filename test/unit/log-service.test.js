import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import LogService from '../../src/services/log-service';

chai.use(sinonChai);

const createLogService = () => new LogService({
  cid: '1234',
  context: {},
  log: { log: sinon.stub() },
});

describe('Log Service', () => {
  describe('Log', () => {
    let logService;
    let logObject;

    beforeEach(() => {
      logService = createLogService();
      logObject = {
        cid: '1234',
        service: undefined,
        version: undefined,
        level: '',
        message: 'Log message',
        data: ['data1', 'data2'],
      };
    });

    it('should stringify data before calling logger', () => {
      logService.log('info', 'Log message', 'data1', 'data2');
      logObject.level = 'info';
      expect(logService.logger.log).to.have.been.calledWith(JSON.stringify(logObject));
    });

    it('should unwrap error before stringifying and calling logger', () => {
      const error = new Error('error message');
      logService.error('Log message', error, 'data2');
      logObject.level = 'error';
      expect(logService.logger.log.firstCall.args[0]).to.contain(JSON.stringify(error.stack));
    });

    it('should log warn when called with warn', () => {
      logService.warn('Log message', 'data1', 'data2');
      logObject.level = 'warn';
      expect(logService.logger.log).to.have.been.calledWith(JSON.stringify(logObject));
    });

    it('should log fatal when called with fatal', () => {
      logService.fatal('Log message', 'data1', 'data2');
      logObject.level = 'fatal';
      expect(logService.logger.log).to.have.been.calledWith(JSON.stringify(logObject));
    });

    it('should not log verbose because verbose is not allowed', () => {
      logService.verbose('Log message', 'data1', 'data2');
      expect(logService.logger.log).to.not.have.been.called;
    });

    it('should not log debug because debug is not allowed', () => {
      logService.debug('Log message', 'data1', 'data2');
      expect(logService.logger.log).to.not.have.been.called;
    });

    it('should log info message', () => {
      logService.info('Log message', 'data1', 'data2');
      expect(logService.logger.log).to.have.been.calledOnce;
    });

    it('should return middleware function', () => {
      const fn = LogService.middleware();
      const req = {};
      const res = {};
      const next = sinon.stub();

      fn(req, res, next);

      expect(req.log).to.be.instanceof(LogService);
      expect(next).to.have.been.calledOnce;
    });
  });
});
