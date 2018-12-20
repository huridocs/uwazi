import 'api/entities';
import 'api/relationships';

import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import settings from 'api/settings';

import fixtures, { newDoc1, newDoc2, newDoc3, newDoc4 } from './fixtures';
import syncWorker from '../syncWorker';
import syncsModel from '../syncsModel';

describe('syncWorker', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
    syncWorker.stopped = false;
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('syncronize', () => {
    it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());

      await syncWorker.syncronize('url');

      expect(request.post.calls.count()).toBe(4);
      expect(request.delete.calls.count()).toBe(1);

      expect(request.post).toHaveBeenCalledWith('url/api/sync', {
        namespace: 'entities',
        data: {
          _id: newDoc1,
          title: 'a new entity',
        }
      });

      expect(request.post).toHaveBeenCalledWith('url/api/sync', {
        namespace: 'entities',
        data: {
          _id: newDoc2,
          title: 'another new entity',
        }
      });

      expect(request.post).toHaveBeenCalledWith('url/api/sync', {
        namespace: 'connections',
        data: {
          _id: newDoc3,
          entity: newDoc1
        }
      });

      expect(request.delete).toHaveBeenCalledWith('url/api/sync', {
        namespace: 'entities',
        data: {
          _id: newDoc4
        }
      });
    });

    it('should update lastSync timestamp with the last change', async () => {
      spyOn(request, 'post').and.returnValue(Promise.resolve());
      spyOn(request, 'delete').and.returnValue(Promise.resolve());

      await syncWorker.syncronize('url');
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
        await syncWorker.syncronize('url');
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
      await syncWorker.intervalSync('url', interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith('url');
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should retry when syncronize throws a request error', async () => {
      let syncCalls = 0;
      spyOn(syncWorker, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          syncWorker.stop();
        }
        syncCalls += 1;
        return Promise.reject(new Error('sync failed'));
      });

      const interval = 0;
      await syncWorker.intervalSync('url', interval);
      expect(syncWorker.syncronize).toHaveBeenCalledWith('url');
      expect(syncWorker.syncronize).toHaveBeenCalledTimes(3);
    });
  });

  describe('start', () => {
    it('should get sync config and start the sync', async () => {
      spyOn(syncWorker, 'intervalSync');
      const interval = 2000;

      await syncWorker.start(interval);
      expect(syncWorker.intervalSync).toHaveBeenCalledWith('url', interval);
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
