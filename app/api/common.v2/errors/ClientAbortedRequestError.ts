import { OperationalError } from './OperationalError.js';

export class ClientAbortedRequestError extends OperationalError {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ClientAbortedRequestError';
  }
}
