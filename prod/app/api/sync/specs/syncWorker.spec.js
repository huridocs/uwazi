"use strict";require("../../entities");
require("../../thesauris/dictionariesModel");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _errorLog = _interopRequireDefault(require("../../log/errorLog"));
require("../../relationships");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));

var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _JSONRequest = _interopRequireDefault(require("../../../shared/JSONRequest"));
var _settings = _interopRequireDefault(require("../../settings"));
var _settingsModel = _interopRequireDefault(require("../../settings/settingsModel"));
var _paths = _interopRequireDefault(require("../../config/paths"));

var _fixtures = _interopRequireWildcard(require("./fixtures"));



































var _syncWorker = _interopRequireDefault(require("../syncWorker"));
var _syncsModel = _interopRequireDefault(require("../syncsModel"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('syncWorker', () => {
  beforeEach(async () => {
    _paths.default.uploadedDocuments = __dirname;
    spyOn(_JSONRequest.default, 'uploadFile').and.returnValue(Promise.resolve());
    spyOn(_errorLog.default, 'error');
    _syncWorker.default.stopped = false;
    _fs.default.writeFileSync(_path.default.join(__dirname, `${_fixtures.newDoc1.toString()}.jpg`));
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterAll(async () => {
    _fs.default.unlinkSync(_path.default.join(__dirname, `${_fixtures.newDoc1.toString()}.jpg`));
    await _testing_db.default.disconnect();
  });

  const syncWorkerWithConfig = async config => _syncWorker.default.syncronize({
    url: 'url',
    config });


  const syncAllTemplates = async () => _syncWorker.default.syncronize({
    url: 'url',
    config: {
      templates: {
        [_fixtures.template1.toString()]: [],
        [_fixtures.template2.toString()]: [],
        [_fixtures.template3.toString()]: [] } } });




  const expectCallToEqual = (call, namespace, data) => {
    expect(call).toEqual(['url/api/sync', { namespace, data }]);
  };

  const expectCallWith = (spy, namespace, data) => {
    expect(spy).toHaveBeenCalledWith('url/api/sync', { namespace, data });
  };

  const getCallsToIds = (namespace, ids) => {
    const namespaceCallsOnly = _JSONRequest.default.post.calls.allArgs().filter(args => args[1].namespace === namespace);
    return {
      calls: ids.map(id => namespaceCallsOnly.find(c => c[1].data._id.toString() === id.toString())),
      callsCount: namespaceCallsOnly.length };

  };

  describe('syncronize', () => {
    beforeEach(() => {
      spyOn(_JSONRequest.default, 'post').and.returnValue(Promise.resolve());
      spyOn(_JSONRequest.default, 'delete').and.returnValue(Promise.resolve());
    });

    it('should sanitize the config to prevent deleted values to affect the process', async () => {
      const deletedTemplate = _testing_db.default.id();
      const deletedProperty = _testing_db.default.id();
      const deletedRelationtype = _testing_db.default.id();

      await syncWorkerWithConfig({
        templates: {
          [_fixtures.template1.toString()]: [_fixtures.template1Property1.toString(), deletedProperty.toString()],
          [deletedTemplate.toString()]: [],
          [_fixtures.template2.toString()]: [] },

        relationtypes: [_fixtures.relationtype1.toString(), deletedRelationtype.toString()] });


      const { callsCount: templateCalls } = getCallsToIds('templates', []);
      const { callsCount: relationtypesCalls } = getCallsToIds('relationtypes', []);

      expect(templateCalls).toBe(2);
      expect(relationtypesCalls).toBe(1);
    });

    it('should only sync whitelisted collections (forbidding certain collections even if present)', async () => {
      await syncWorkerWithConfig({ migrations: {}, sessions: {} });

      expect(_JSONRequest.default.post.calls.count()).toBe(0);
      expect(_JSONRequest.default.delete.calls.count()).toBe(0);
    });

    describe('settings', () => {
      it('should only include languages from settings', async () => {
        await syncWorkerWithConfig({
          templates: {} });


        const { calls: [settingsCall], callsCount } = getCallsToIds('settings', [_fixtures.settingsId]);

        expect(callsCount).toBe(1);

        expectCallToEqual(settingsCall, 'settings', {
          _id: _fixtures.settingsId,
          languages: [{ key: 'es', default: true }] });

      });
    });

    describe('templates', () => {
      it('should only sync whitelisted templates and properties', async () => {
        const deletedProperty = _testing_db.default.id();
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [_fixtures.template1Property1.toString(), _fixtures.template1Property3.toString(), deletedProperty.toString()],
            [_fixtures.template2.toString()]: [] } });



        const { calls: [template1Call, template2Call], callsCount } = getCallsToIds('templates', [_fixtures.template1, _fixtures.template2]);

        expect(callsCount).toBe(2);

        expectCallToEqual(template1Call, 'templates', expect.objectContaining({
          properties: [
          expect.objectContaining({ _id: _fixtures.template1Property1 }),
          expect.objectContaining({ _id: _fixtures.template1Property3 })] }));



        expectCallToEqual(template2Call, 'templates', expect.objectContaining({ _id: _fixtures.template2 }));
      });
    });

    describe('thesauris (dictionaries collection)', () => {
      it('should sync whitelisted thesauris through template configs (deleting even non whitelisted ones)', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [
            _fixtures.template1Property2.toString(),
            _fixtures.template1PropertyThesauri1Select.toString(),
            _fixtures.template1PropertyThesauri3MultiSelect.toString()],

            [_fixtures.template2.toString()]: [_fixtures.template2PropertyThesauri5Select.toString()] } });



        const { calls: [thesauri1Call, thesauri3Call, thesauri5Call], callsCount } = getCallsToIds('dictionaries', [_fixtures.thesauri1, _fixtures.thesauri3, _fixtures.thesauri5]);

        expect(callsCount).toBe(3);

        expectCallToEqual(thesauri1Call, 'dictionaries', expect.objectContaining({
          values: [expect.objectContaining({ _id: _fixtures.thesauri1Value1 }), expect.objectContaining({ _id: _fixtures.thesauri1Value2 })] }));


        expect(thesauri3Call).toBeDefined();
        expect(thesauri5Call).toBeDefined();
        expectCallWith(_JSONRequest.default.delete, 'dictionaries', expect.objectContaining({ _id: _fixtures.thesauri4 }));
      });
    });

    describe('relationtypes', () => {
      it('should sync whitelisted relationtypes and those from approved metadata properties', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [_fixtures.template1PropertyRelationship1.toString()],
            [_fixtures.template2.toString()]: [_fixtures.template2PropertyRelationship2.toString()] },

          relationtypes: [_fixtures.relationtype1.toString(), _fixtures.relationtype3.toString()] });


        const {
          calls: [relationtype1Call, relationtype3Call, relationtype4Call, relationtype7Call],
          callsCount } =
        getCallsToIds('relationtypes', [_fixtures.relationtype1, _fixtures.relationtype3, _fixtures.relationtype4, _fixtures.relationtype7]);

        expect(callsCount).toBe(4);
        expect(relationtype1Call).toBeDefined();
        expect(relationtype3Call).toBeDefined();
        expect(relationtype4Call).toBeDefined();
        expect(relationtype7Call).toBeDefined();
      });

      it('should allow syncing only from templates, without whitelisting a whole relationtype', async () => {
        await syncWorkerWithConfig({
          templates: { [_fixtures.template1.toString()]: [_fixtures.template1PropertyRelationship1.toString()] } });


        const { calls: [relationtype4Call], callsCount } = getCallsToIds('relationtypes', [_fixtures.relationtype4]);

        expect(callsCount).toBe(1);
        expect(relationtype4Call).toBeDefined();
      });
    });

    describe('translations', () => {
      it('should include System context and exclude non-whitelisted templates, thesauris and relationtypes', async () => {
        await syncWorkerWithConfig({ templates: {} });
        const { calls: [translation1Call] } = getCallsToIds('translations', [_fixtures.translation1]);
        const { contexts } = translation1Call[1].data;

        expect(contexts.find(c => c.id === 'System').values).toEqual([{ key: 'Sytem Key', value: 'System Value' }]);
        expect(contexts.length).toBe(1);
      });

      it('should include from whitelisted templates and relationstypes, as well as derived thesauris and relationstypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [
            _fixtures.template1PropertyRelationship1.toString(),
            _fixtures.template1PropertyThesauri3MultiSelect.toString()],

            [_fixtures.template2.toString()]: [_fixtures.template2PropertyRelationship2.toString()] },

          relationtypes: [_fixtures.relationtype1.toString()] });


        const { calls: [translation1Call] } = getCallsToIds('translations', [_fixtures.translation1]);
        const { contexts } = translation1Call[1].data;

        expect(contexts.find(c => c.id.toString() === _fixtures.template1.toString()).values).toEqual([
        { key: 'template1', value: 'template1T' },
        { key: 't1Relationship1L', value: 't1Relationship1T' },
        { key: 't1Thesauri3MultiSelectL', value: 't1Thesauri3MultiSelectT' }]);

        expect(contexts.find(c => c.id.toString() === _fixtures.template2.toString()).values).toEqual([
        { key: 'template2', value: 'template2T' },
        { key: 't2Relationship2L', value: 't2Relationship2T' }]);

        expect(contexts.find(c => c.id.toString() === _fixtures.relationtype1.toString()).values).toBe('All values from r1');
        expect(contexts.find(c => c.id.toString() === _fixtures.relationtype4.toString()).values).toBe('All values from r4');
        expect(contexts.find(c => c.id.toString() === _fixtures.relationtype7.toString()).values).toBe('All values from r7');
        expect(contexts.find(c => c.id.toString() === _fixtures.thesauri3.toString()).values).toBe('All values from t3');
        expect(contexts.length).toBe(7);
      });
    });

    describe('entities', () => {
      it('should only sync entities belonging to a whitelisted template and properties and exclude non-templated entities', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [_fixtures.template1Property2.toString(), _fixtures.template1Property3.toString(), _fixtures.template1PropertyThesauri1Select.toString()],
            [_fixtures.template2.toString()]: [] } });



        const { calls: [entity1Call, entity2Call], callsCount } = getCallsToIds('entities', [_fixtures.newDoc1, _fixtures.newDoc2]);

        expect(callsCount).toBe(2);

        expectCallToEqual(entity1Call, 'entities', expect.objectContaining({
          metadata: { t1Property2: 'sync property 2', t1Property3: 'sync property 3', t1Thesauri1Select: _fixtures.thesauri1Value2 } }));


        expectCallToEqual(entity2Call, 'entities', expect.objectContaining({
          metadata: { t1Property2: 'another doc property 2' } }));


        expect(_JSONRequest.default.post).not.toHaveBeenCalledWith('url/api/sync', {
          namespace: 'entities',
          data: expect.objectContaining({ title: 'not to sync' }) });

      });

      it('should upload main file, and thumbnail when file timestamp is newer than lastSync', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [],
            [_fixtures.template3.toString()]: [] } });



        expect(_JSONRequest.default.uploadFile.calls.count()).toBe(4);
        expect(_JSONRequest.default.uploadFile).toHaveBeenCalledWith('url/api/sync/upload', 'test.txt', _fs.default.readFileSync(_path.default.join(__dirname, 'test.txt')));
        expect(_JSONRequest.default.uploadFile).toHaveBeenCalledWith(
        'url/api/sync/upload',
        'test_attachment.txt',
        _fs.default.readFileSync(_path.default.join(__dirname, 'test_attachment.txt')));

        expect(_JSONRequest.default.uploadFile).toHaveBeenCalledWith(
        'url/api/sync/upload',
        'test_attachment2.txt',
        _fs.default.readFileSync(_path.default.join(__dirname, 'test_attachment2.txt')));

        expect(_JSONRequest.default.uploadFile).toHaveBeenCalledWith(
        'url/api/sync/upload',
        `${_fixtures.newDoc1.toString()}.jpg`,
        _fs.default.readFileSync(_path.default.join(__dirname, `${_fixtures.newDoc1.toString()}.jpg`)));

      });
    });

    describe('relationships (connections collection)', () => {
      it('should sync from approved template / entities and raw whitelisted relationtypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [],
            [_fixtures.template2.toString()]: [] },

          relationtypes: [_fixtures.relationtype1.toString(), _fixtures.relationtype3.toString()] });


        const { calls: [relationship1Call, relationship2Call], callsCount } = getCallsToIds('connections', [_fixtures.relationship1, _fixtures.relationship2]);

        expect(callsCount).toBe(2);
        expect(relationship1Call).toBeDefined();
        expect(relationship2Call).toBeDefined();
      });

      it('should allow including null relationTypes', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [] },

          relationtypes: [null] });


        const { calls: [relationship9Call], callsCount } = getCallsToIds('connections', [_fixtures.relationship9]);

        expect(callsCount).toBe(1);
        expect(relationship9Call).toBeDefined();
      });

      it('should include from specific types inlcuded through metadata (taking null left hand-side relationships)', async () => {
        await syncWorkerWithConfig({
          templates: {
            [_fixtures.template1.toString()]: [_fixtures.template1PropertyRelationship1.toString()],
            [_fixtures.template2.toString()]: [_fixtures.template2PropertyRelationship2.toString()] } });



        const {
          calls: [relationsihp5Call, relationsihp7Call, relationsihp9Call, relationsihp10Call, relationsihp11Call],
          callsCount } =
        getCallsToIds('connections', [_fixtures.relationship5, _fixtures.relationship7, _fixtures.relationship9, _fixtures.relationship10, _fixtures.relationship11]);

        expect(callsCount).toBe(5);
        expect(relationsihp5Call).toBeDefined();
        expect(relationsihp7Call).toBeDefined();
        expect(relationsihp9Call).toBeDefined();
        expect(relationsihp10Call).toBeDefined();
        expect(relationsihp11Call).toBeDefined();
      });
    });

    it('should process the log records newer than the current sync time (minus 1 sec)', async () => {
      await syncAllTemplates();

      expect(_JSONRequest.default.post.calls.count()).toBe(8);
      expect(_JSONRequest.default.delete.calls.count()).toBe(2);
    });

    it('should update lastSync timestamp with the last change', async () => {
      await syncAllTemplates();
      const [{ lastSync }] = await _syncsModel.default.find();
      expect(lastSync).toBe(20000);
    });

    it('should update lastSync on each operation', async () => {
      _JSONRequest.default.post.and.callFake((url, body) => body.data._id.equals(_fixtures.relationship1) ? Promise.reject(new Error('post failed')) : Promise.resolve());

      _JSONRequest.default.delete.and.callFake((url, body) => body.data._id.equals(_fixtures.newDoc4) ? Promise.reject(new Error('delete failed')) : Promise.resolve());


      try {
        await syncAllTemplates();
      } catch (e) {
        const [{ lastSync }] = await _syncsModel.default.find();
        expect(lastSync).toBe(12000);
      }
    });
  });

  describe('intervalSync', () => {
    it('should syncronize every x seconds', async () => {
      let syncCalls = 0;
      spyOn(_syncWorker.default, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          _syncWorker.default.stop();
        }
        syncCalls += 1;
        return Promise.resolve();
      });

      const interval = 0;
      await _syncWorker.default.intervalSync({ url: 'url' }, interval);
      expect(_syncWorker.default.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(_syncWorker.default.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should retry when syncronize returns a request error', async () => {
      let syncCalls = 0;
      spyOn(_syncWorker.default, 'syncronize').and.callFake(() => {
        if (syncCalls === 2) {
          _syncWorker.default.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 500, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await _syncWorker.default.intervalSync({ url: 'url' }, interval);
      expect(_syncWorker.default.syncronize).toHaveBeenCalledWith({ url: 'url' });
      expect(_syncWorker.default.syncronize).toHaveBeenCalledTimes(3);
    });

    it('should login when a sync response its "Unauthorized"', async () => {
      spyOn(_syncWorker.default, 'login').and.returnValue(Promise.resolve());
      let syncCalls = 0;
      spyOn(_syncWorker.default, 'syncronize').and.callFake(() => {
        if (syncCalls === 1) {
          _syncWorker.default.stop();
        }
        syncCalls += 1;
        return Promise.reject({ status: 401, message: 'error' }); // eslint-disable-line prefer-promise-reject-errors
      });

      const interval = 0;
      await _syncWorker.default.intervalSync({ url: 'url', username: 'configUser', password: 'configPassword' }, interval);
      expect(_syncWorker.default.login).toHaveBeenCalledWith('url', 'configUser', 'configPassword');
    });
  });

  describe('login', () => {
    it('should login to the target api and set the cookie', async () => {
      _fetchMock.default.restore();
      _fetchMock.default.post('http://localhost/api/login', { body: '{}', headers: { 'set-cookie': 'cookie' } });
      spyOn(_JSONRequest.default, 'cookie');
      await _syncWorker.default.login('http://localhost', 'username', 'password');
      expect(_JSONRequest.default.cookie).toHaveBeenCalledWith('cookie');
    });

    it('should catch errors and log them', async () => {
      spyOn(_JSONRequest.default, 'post').and.callFake(() => Promise.reject(new Error('post failed')));
      await _syncWorker.default.login('http://localhost', 'username', 'password');
      expect(_errorLog.default.error.calls.argsFor(0)[0]).toMatch('post failed');
    });
  });

  describe('start', () => {
    it('should not fail on sync not in settings', async () => {
      await _settingsModel.default.db.update({}, { $unset: { sync: '' } });
      spyOn(_syncWorker.default, 'intervalSync');
      const interval = 2000;

      let thrown;
      try {
        await _syncWorker.default.start(interval);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).not.toBeDefined();
    });

    it('should lazy create lastSync entry if not exists', async () => {
      await _syncsModel.default.remove({});

      await _syncWorker.default.start();
      const [{ lastSync }] = await _syncsModel.default.find();
      expect(lastSync).toBe(0);
    });

    it('should get sync config and start the sync', async () => {
      spyOn(_syncWorker.default, 'intervalSync');
      const interval = 2000;

      await _syncWorker.default.start(interval);
      expect(_syncWorker.default.intervalSync).toHaveBeenCalledWith({ url: 'url', active: true, config: {} }, interval);
    });

    describe('when there is no sync config', () => {
      it('should not start the intervalSync', async () => {
        spyOn(_syncWorker.default, 'intervalSync');
        await _settings.default.save({ sync: {} });
        await _syncWorker.default.start();
        expect(_syncWorker.default.intervalSync).not.toHaveBeenCalled();
      });
    });
  });
});