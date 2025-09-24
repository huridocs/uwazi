// @ts-expect-error TS(2307): Cannot find module '../utils/testingRoutes.js' or ... Remove this comment to see the full error message
import { setUpApp } from '../utils/testingRoutes.js';
import { NextFunction } from 'express';
// @ts-expect-error TS(2307): Cannot find module '../../shared/tasks/tasks.js' o... Remove this comment to see the full error message
import { Task, TaskProvider } from 'shared/tasks/tasks.js';
import request from 'supertest';
import testRoute from '../routes';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

jest.mock(
  '../../utils/languageMiddleware.ts',
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

class TestTask extends Task {
  protected async run(args: any) {
    if (args.a === 0) {
      throw Error('Bad a!');
    }
    // @ts-expect-error TS(2339): Property 'status' does not exist on type 'TestTask... Remove this comment to see the full error message
    this.status.message = `${args.a}`;
    // @ts-expect-error TS(2339): Property 'status' does not exist on type 'TestTask... Remove this comment to see the full error message
    this.status.result.a = args.a;
  }
}
TaskProvider.registerClass('TestTask', TestTask);

describe('task routes', () => {
  const app = setUpApp(testRoute);

  describe('GET', () => {
    it('should return empty for undefined task', async () => {
      const response = await request(app).get('/api/tasks').query({ name: 'a' });
      expect(response.body).toEqual({ state: 'undefined' });
    });

    it('should start and return task', async () => {
      let response = await request(app)
        .post('/api/tasks')
        .query({
          name: 'a',
          type: 'TestTask',
        })
        .send({ a: 1 });
      expect(response.body.startTime).not.toBe(undefined);
      response = await request(app).get('/api/tasks').query({ name: 'a' });
      while (response.body.status === 'running') {
        /* eslint-disable no-await-in-loop */
        response = await request(app).get('/api/tasks').query({ name: 'a' });
      }
      expect(response.body.message).toBe('1');
      expect(response.body.result).toEqual({ a: 1 });
    });
  });
});
