import 'api/entities';
import errorLog from 'api/log/errorLog';
import 'api/relationships';
import backend from 'fetch-mock';

import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import settings from 'api/settings';
import settingsModel from 'api/settings/settingsModel';

import fixtures, {
  newDoc1,
  newDoc2,
  newDoc3,
  newDoc4,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template2,
  template3,
} from './fixtures';
import syncWorker from '../syncWorker';
import syncsModel from '../syncsModel';

describe('syncWorker', () => {
  beforeEach((done) => {
    spyOn(errorLog, 'error');
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
    syncWorker.stopped = false;
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  const syncAllTemplates = async () => syncWorker.syncronize({
    url: 'url',
    config: {
      templates: {
        [template1.toString()]: [],
        [template2.toString()]: [],
        [template3.toString()]: [],
      }
    }
  });

  describe('syncronize', () => {
    it('should lazy create lastSync entry if not exists', async () => {
      spyOn(request, 'post').and.callFake(() => Promise.reject());
      spyOn(request, 'delete').and.callFake(() => Promise.reject());

      await syncsModel.remove({});

      try {
        await syncWorker.syncronize({ url: 'url', config: {} });
      } catch (e) {
        const [{ lastSync }] = await syncsModel.find();
        expect(lastSync).toBe(0);
      }
    });

    describe('templates', () => {
      it('should only sync white listed templates and properties', async () => {
        spyOn(request, 'post').and.returnValue(Promise.resolve());
        spyOn(request, 'delete').and.returnValue(Promise.resolve());

        await syncWorker.syncronize({
          url: 'url',
          config: {
            templates: {
              [template1.toString()]: [template1Property1.toString(), template1Property3.toString()],
              [template2.toString()]: [],
            }
          }
        });

        const templateCallsOnly = request.post.calls.allArgs().filter(args => args[1].namespace === 'templates');
        const template1Call = templateCallsOnly.find(call => call[1].data._id.toString() === template1.toString());
        const template2Call = templateCallsOnly.find(call => call[1].data._id.toString() === template2.toString());

        expect(templateCallsOnly.length).toBe(2);

        expect(template1Call).toEqual(['url/api/sync', {
          namespace: 'templates',
          data: {
            _id: template1,
            properties: [
              expect.objectContaining({ _id: template1Property1 }),
              expect.objectContaining({ _id: template1Property3 })
            ]
          }
        }]);
        expect(template2Call).toEqual(['url/api/sync', {
          namespace: 'templates',
          data: { _id: template2 }
        }]);
      });
    });

    describe('entities', () => {
      it('should only sync entities belonging to a white listed template and properties', async () => {
        spyOn(request, 'post').and.returnValue(Promise.resolve());
        spyOn(request, 'delete').and.returnValue(Promise.resolve());

        await syncWorker.syncronize({
          url: 'url',
          config: {
            templates: {
              [template1.toString()]: [template1Property2.toString(), template1Property3.toString()],
              [template2.toString()]: [],
            }
          }
        });

        const entitiesCallsOnly = request.post.calls.allArgs().filter(args => args[1].namespace === 'entities');
        const entity1Call = entitiesCallsOnly.find(call => call[1].data._id.toString() === newDoc1.toString());
        const entity2Call = entitiesCallsOnly.find(call => call[1].data._id.toString() === newDoc2.toString());

        expect(entity1Call).toEqual(['url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({
            _id: newDoc1,
            metadata: {
              t1Property2: 'sync property 2',
              t1Property3: 'sync property 3',
            }
          })
        }]);

        expect(entity2Call).toEqual(['url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({
            _id: newDoc2,
            metadata: { t1Property2: 'another doc property 2' },
          })
        }]);

        expect(request.post).not.toHaveBeenCalledWith('url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({ title: 'not to sync' })
        });
      });
    });

    it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());

      await syncAllTemplates();

      expect(request.post.calls.count()).toBe(8);
      expect(request.delete.calls.count()).toBe(1);
    });

    it('should update lastSync timestamp with the last change', async () => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());

      await syncAllTemplates();
      const [{ lastSync }] = await syncsModel.find();
      expect(lastSync).toBe(22000);
    });

    it('should update lastSync on each operation', async () => {
      spyOn(request, 'post').and.callFake((url, body) =>
        body.data._id.equals(newDoc3) ? Promise.reject(new Error('post failed')) : Promise.resolve()
      );
      spyOn(request, 'delete').and.callFake((url, body) =>
        body.data._id.equals(newDoc4) ? Promise.reject(new Error('delete failed')) : Promise.resolve()
      );

      try {
        await syncAllTemplates();
      } catch (e) {
        const [{ lastSync }] = await syncsModel.find();
        expect(lastSync).toBe(12000);
      }
    });
  });

  describe('intervalSync', () => {
    it('should syncronize every x seconds', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.resolve();
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should retry when syncronize returns a request error', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 500, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should login when a sync response its "Unauthorized"', async () => {
      spyOn(syncWorker, 'login').and.returnValue(Promise.resolve());
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 1) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 401, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await syncWorker.intervalSync({ url: 'url' }, interval);
      expect(syncWorker.login).toHaveBeenCalledWith('url', 'admin', 'admin');
    });
  });

  describe('login', () => {
    it('should login to the target api and set the cookie', async () => {
      backend.restore();
      backend.post('http://localhost/api/login', { body: '{}', headers: { 'set-cookie': 'cookie' } });
      spyOn(request, 'cookie');
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(request.cookie).toHaveBeenCalledWith('cookie');
    });

    it('should catch errors and log them', async () => {
      spyOn(request, 'post').and.callFake(() => Promise.reject(new Error('post failed')));
      await syncWorker.login('http://localhost', 'username', 'password');
      expect(errorLog.error.calls.argsFor(0)[0]).toMatch('post failed');
    });
  });

  describe('start', () => {
    it('should not fail on sync not in settings', async () => {
      await settingsModel.db.update({}, { $unset: { sync: '' } });
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      let thrown;
      try {
        await syncWorker.start(interval);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).not.toBeDefined();
    });
    it('should get sync config and start the sync', async () => {
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      await syncWorker.start(interval);
      expect(syncWorker.intervalSync).toHaveBeenCalledWith({ url: 'url', active: true, config: {} }, interval);
    });

    describe('when there is no sync config', () => {
      it('should not start the intervalSync', async () => {
        spyOn(syncWorker, 'intervalSync');
        await settings.save({ sync: {} });
        await syncWorker.start();
        expect(syncWorker.intervalSync).not.toHaveBeenCalled();
      });
    });
  });
});
