"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _entities = _interopRequireDefault(require("../../entities"));
var _path = _interopRequireDefault(require("path"));
var _i18n = _interopRequireDefault(require("../../i18n"));

var _csvLoader = _interopRequireDefault(require("../csvLoader"));
var _fixtures = _interopRequireWildcard(require("./fixtures"));
var _helpers = require("./helpers");
var _typeParsers = _interopRequireDefault(require("../typeParsers"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('csvLoader', () => {
  const csvFile = _path.default.join(__dirname, '/test.csv');
  const loader = new _csvLoader.default();

  _typeParsers.default.select = () => Promise.resolve('thesauri');
  _typeParsers.default.text = () => Promise.resolve('text');
  _typeParsers.default.default = () => Promise.resolve('default');

  beforeAll(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
    spyOn(_entities.default, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(_i18n.default, 'updateContext').and.returnValue(Promise.resolve());
  });

  afterAll(async () => _testing_db.default.disconnect());

  it('should use the passed user', async () => {
    spyOn(_entities.default, 'save').and.returnValue(Promise.resolve({}));
    await loader.load(csvFile, _fixtures.template1Id, { user: { username: 'user' }, language: 'en' });
    expect(_entities.default.save.calls.argsFor(0)[1].user).toEqual({ username: 'user' });
  });

  describe('load', () => {
    let imported;
    const events = [];

    beforeAll(async () => {
      loader.on('entityLoaded', entity => {
        events.push(entity.title);
      });

      try {
        await loader.load(csvFile, _fixtures.template1Id, { language: 'en' });
      } catch (e) {
        throw loader.errors()[Object.keys(loader.errors())[0]];
      }

      imported = await _entities.default.get();
    });


    it('should load title', () => {
      const textValues = imported.map(i => i.title);
      expect(textValues).toEqual(['title1', 'title2', 'title3']);
    });

    it('should emit event after each entity has been imported', () => {
      expect(events).toEqual(['title1', 'title2', 'title3']);
    });

    it('should only import valid metadata', () => {
      const metadataImported = Object.keys(imported[0].metadata);
      expect(metadataImported).toEqual([
      'text_label',
      'select_label',
      'not_defined_type']);

    });

    it('should ignore properties not configured in the template', () => {
      const textValues = imported.
      map(i => i.metadata.non_configured).
      filter(i => i);

      expect(textValues.length).toEqual(0);
    });

    describe('metadata parsing', () => {
      it('should parse metadata properties by type using typeParsers', () => {
        const textValues = imported.map(i => i.metadata.text_label);
        expect(textValues).toEqual(['text', 'text', 'text']);

        const thesauriValues = imported.map(i => i.metadata.select_label);
        expect(thesauriValues).toEqual(['thesauri', 'thesauri', 'thesauri']);
      });

      describe('when parser not defined', () => {
        it('should use default parser', () => {
          const noTypeValues = imported.map(i => i.metadata.not_defined_type);
          expect(noTypeValues).toEqual(['default', 'default', 'default']);
        });
      });
    });
  });

  describe('on error', () => {
    it('should stop processing on the first error', async () => {
      const testingLoader = new _csvLoader.default();

      await _testing_db.default.clearAllAndLoad(_fixtures.default);
      spyOn(_entities.default, 'save').and.callFake(entity => Promise.reject(new Error(`error-${entity.title}`)));

      try {
        await testingLoader.load(csvFile, _fixtures.template1Id);
        fail('should fail');
      } catch (e) {
        expect(e).toEqual(new Error('error-title1'));
      }
    });
  });

  describe('no stop on errors', () => {
    beforeAll(async () => {
      spyOn(_entities.default, 'save').and.callFake(entity => {
        if (entity.title === 'title1' || entity.title === 'title3') {
          return Promise.reject(new Error(`error-${entity.title}`));
        }
        return Promise.resolve({});
      });
      await _testing_db.default.clearAllAndLoad(_fixtures.default);
    });

    it('should emit an error', async () => {
      const testingLoader = new _csvLoader.default({ stopOnError: false });

      const eventErrors = {};
      testingLoader.on('loadError', (error, entity) => {
        eventErrors[entity.title] = error;
      });

      try {
        await testingLoader.load(csvFile, _fixtures.template1Id);
      } catch (e) {
        expect(eventErrors).toEqual({
          title1: new Error('error-title1'),
          title3: new Error('error-title3') });

      }
    });

    it('should save errors and index them by csv line, should throw an error on finish', async () => {
      const testingLoader = new _csvLoader.default({ stopOnError: false });

      try {
        await testingLoader.load(csvFile, _fixtures.template1Id);
        fail('should fail');
      } catch (e) {
        expect(testingLoader.errors()).toEqual({
          0: new Error('error-title1'),
          2: new Error('error-title3') });

      }
    });

    it('should fail when parsing throws an error', async () => {
      _entities.default.save.and.callFake(() => Promise.resolve({}));
      spyOn(_typeParsers.default, 'text').and.callFake(entity => {
        if (entity.title === 'title2') {
          return Promise.reject(new Error(`error-${entity.title}`));
        }
        return Promise.resolve({});
      });

      const testingLoader = new _csvLoader.default({ stopOnError: false });

      try {
        await testingLoader.load(csvFile, _fixtures.template1Id);
        fail('should fail');
      } catch (e) {
        expect(testingLoader.errors()).toEqual({
          1: new Error('error-title2') });

      }
    });
  });

  describe('when sharedId is provided', () => {
    it('should update the entitiy', async () => {
      const entity = await _entities.default.save(
      { title: 'entity', template: _fixtures.template1Id },
      { user: {}, language: 'en' });

      const csv = `id                , title    ,
                   ${entity.sharedId}, new title,
                                     , title2   ,`;

      const testingLoader = new _csvLoader.default();
      await testingLoader.load((0, _helpers.stream)(csv), _fixtures.template1Id, { language: 'en' });

      const [expected] = await _entities.default.get({
        sharedId: entity.sharedId,
        language: 'en' });

      expect(expected.title).toBe('new title');
    });
  });
});