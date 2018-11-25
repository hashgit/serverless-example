import CustomResponseException from './custom-response-exception';

export default class Response404Exception extends CustomResponseException {
  constructor(message, code) {
    super(404, message, code);
  }
}
