import CustomResponseException from './custom-response-exception';

export default class Response400Exception extends CustomResponseException {
  constructor(message, code) {
    super(400, message, code);
  }
}
