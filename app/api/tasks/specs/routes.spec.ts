/** @format */
import instrumentRoutes from 'api/utils/instrumentRoutes.js';
import { TaskProvider, Task } from '../tasks';
import testRoute from '../routes';

require('api/utils/jasmineHelpers');

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
  let routes: { get: any; post: any };

  beforeEach(() => {
    routes = instrumentRoutes(testRoute);
  });

  describe('GET', () => {
    it('should need authorization', () => {
      const req = {};
      expect(routes.get('/api/tasks', req)).toNeedAuthorization();
    });

    it('should return empty for undefined task', async () => {
      const response = await routes.get('/api/tasks', { query: { name: 'a' } });
      expect(response).toEqual({ state: 'undefined' });
    });

    it('should start and return task', async () => {
      let response = await routes.post('/api/tasks', {
        query: {
          name: 'a',
          type: 'TestTask',
          args: { a: 1 },
        },
      });
      expect(response.startTime).not.toBe(undefined);
      response = await routes.get('/api/tasks', { query: { name: 'a' } });
      while (response.status === 'running') {
        response = await routes.get('/api/tasks', { query: { name: 'a' } }); // eslint-disable-line
      }
      expect(response.message).toBe('1');
      expect(response.result).toEqual({ a: 1 });
    });
  });
});
