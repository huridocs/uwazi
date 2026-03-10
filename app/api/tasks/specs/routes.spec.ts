import { setUpApp } from 'api/utils/testingRoutes';
import { NextFunction } from 'express';
import { Task, TaskProvider } from 'shared/tasks/tasks';
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
    this.status.message = `${args.a}`;
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
