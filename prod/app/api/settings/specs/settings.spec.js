"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _translations = _interopRequireDefault(require("../../i18n/translations"));
var _settings2 = _interopRequireDefault(require("../settings.js"));
var _fixtures = _interopRequireDefault(require("./fixtures.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('settings', () => {
  beforeEach(done => {
    spyOn(_translations.default, 'updateContext').and.returnValue(Promise.resolve('ok'));
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save()', () => {
    it('should save the settings', done => {
      const config = { site_name: 'My collection' };
      _settings2.default.save(config).
      then(() => _settings2.default.save({ custom: { customNested: 'data' } })).
      then(() => _settings2.default.get()).
      then(result => {
        expect(result.site_name).toBe('My collection');
        expect(result.custom.customNested).toBe('data');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should return the updated settings', done => {
      const config = { site_name: 'New settings' };

      _settings2.default.save(config).
      then(createdDocument => {
        expect(createdDocument.site_name).toBe(config.site_name);
        expect(createdDocument.allowedPublicTemplates[0]).toBe('id1');
        expect(createdDocument.allowedPublicTemplates[1]).toBe('id2');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when there are Links', () => {
      let config;

      beforeEach(() => {
        config = { site_name: 'My collection', links: [{ title: 'Page one' }] };
      });

      it('should create a translation context for the passed links', done => {
        _settings2.default.save(config).
        then(() => {
          expect(_translations.default.updateContext).toHaveBeenCalledWith('Menu', 'Menu', {}, [], { 'Page one': 'Page one' }, 'Uwazi UI');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      describe('updating the links', () => {
        it('should update the translation context for the links', done => {
          config.links.push({ title: 'Page two' });
          _settings2.default.save(config).
          then(savedConfig => {
            config = { site_name: 'My collection', links: [{ title: 'Page 1', _id: savedConfig.links[0]._id }, { title: 'Page three' }] };
            return _settings2.default.save(config);
          }).
          then(() => {
            expect(_translations.default.updateContext).
            toHaveBeenCalledWith(
            'Menu',
            'Menu',
            { 'Page one': 'Page 1' },
            ['Page two'],
            { 'Page 1': 'Page 1', 'Page three': 'Page three' },
            'Uwazi UI');

            done();
          }).
          catch((0, _jasmineHelpers.catchErrors)(done));
        });
      });
    });

    describe('when there are filter groups', () => {
      it('should create translations for them', done => {
        const config = {
          site_name: 'My collection',
          filters: [{ id: 1, name: 'Judge' },
          { id: 2, name: 'Documents', items: [{ id: 3, name: 'Cause' }] }] };

        _settings2.default.save(config).
        then(() => {
          expect(_translations.default.updateContext).toHaveBeenCalledWith('Filters', 'Filters', {}, [], { Documents: 'Documents' }, 'Uwazi UI');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should update them', done => {
        let config = {
          site_name: 'My collection',
          filters: [{ id: '1', name: 'Judge' }, { id: '2', name: 'Documents', items: [] }, { id: '3', name: 'Files', items: [] }] };

        _settings2.default.save(config).
        then(() => {
          config = { site_name: 'My collection', filters: [{ id: '1', name: 'Judge' }, { id: '2', name: 'Important Documents', items: [] }] };
          _translations.default.updateContext.calls.reset();
          return _settings2.default.save(config);
        }).
        then(() => {
          expect(_translations.default.updateContext).
          toHaveBeenCalledWith(
          'Filters',
          'Filters', { Documents: 'Important Documents' },
          ['Files'],
          { 'Important Documents': 'Important Documents' },
          'Uwazi UI');

          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('when no links or filters are present', () => {
      it('should not update contexts translations', async () => {
        await _settings2.default.save({ css: 'something that does not have links' });
        await _translations.default.get();
        expect(_translations.default.updateContext).not.toHaveBeenCalled();
      });
    });
  });

  describe('get()', () => {
    describe('if there is no settings on the DB', () => {
      it('should return an empty object', done => {
        _testing_db.default.clear(['settings'], () => {
          _settings2.default.get().
          then(result => {
            expect(result).toEqual({});
            done();
          }).
          catch((0, _jasmineHelpers.catchErrors)(done));
        });
      });
    });

    it('should not return private values', async () => {
      const values = await _settings2.default.get();
      expect(values.publicFormDestination).not.toBeDefined();
    });

    it('should return private values if asked for', async () => {
      const values = await _settings2.default.get(true);
      expect(values.publicFormDestination).toBeDefined();
    });
  });

  describe('setDefaultLanguage()', () => {
    it('should save the settings with the new default language', done => {
      _settings2.default.setDefaultLanguage('en').
      then(() => _settings2.default.get()).
      then(result => {
        expect(result.languages[1].key).toBe('en');
        expect(result.languages[1].default).toBe(true);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('addLanguage()', () => {
    it('should add a to settings list language', done => {
      _settings2.default.addLanguage({ key: 'fr', label: 'Frances' }).
      then(() => _settings2.default.get()).
      then(result => {
        expect(result.languages.length).toBe(3);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('deleteLanguage()', () => {
    it('should add a to settings list language', done => {
      _settings2.default.deleteLanguage('en').
      then(() => _settings2.default.get()).
      then(result => {
        expect(result.languages.length).toBe(1);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('removeTemplateFromFilters', () => {
    it('should remove the template from the filters', done => {
      const _settings = {
        filters: [
        { id: '123' },
        {
          id: 'axz',
          items: [{ id: '123' }] }] };



      spyOn(_settings2.default, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(_settings2.default, 'save');
      _settings2.default.removeTemplateFromFilters('123').
      then(() => {
        expect(_settings2.default.save).toHaveBeenCalledWith({ filters: [{ id: 'axz', items: [] }] });
        done();
      });
    });
  });

  describe('updateFilterName', () => {
    const _settings = {
      filters: [
      { id: '123', name: 'Batman' }] };



    it('should update a filter name', async () => {
      spyOn(_settings2.default, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(_settings2.default, 'save').and.returnValue(Promise.resolve('updatedSettings'));

      const updatedFilter = await _settings2.default.updateFilterName('123', 'The dark knight');

      expect(_settings2.default.save).toHaveBeenCalledWith({ filters: [{ id: '123', name: 'The dark knight' }] });
      expect(updatedFilter).toEqual('updatedSettings');
    });

    it('should do nothing when filter does not exist', async () => {
      spyOn(_settings2.default, 'get').and.returnValue(Promise.resolve(_settings));
      spyOn(_settings2.default, 'save').and.returnValue(Promise.resolve('updatedSettings'));

      const updatedFilter = await _settings2.default.updateFilterName('321', 'Filter not present');

      expect(_settings2.default.save).not.toHaveBeenCalled();
      expect(updatedFilter).toBeUndefined();
    });
  });
});