import { Response } from 'supertest';
import { inspect } from 'util';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStatus(expectedStatus: number): R;
    }
  }
}

function toHaveStatus(received: Response, expectedStatus: number) {
  const actualStatus = received.status;

  const pass = actualStatus === expectedStatus;

  const message = pass
    ? () => `Expected response *not* to have status ${expectedStatus}, but got ${actualStatus}.`
    : () =>
        `Expected response to have status ${expectedStatus}, but got ${actualStatus}.\n` +
        `Response body:\n${inspect(received.body)}`;

  return { pass, message };
}

expect.extend({ toHaveStatus });
