"use strict";var _translations = _interopRequireDefault(require("../../i18n/translations"));
var _templates = _interopRequireDefault(require("../../templates/templates"));
var _entities = _interopRequireDefault(require("../../entities/entities"));
var _jasmineHelpers = require("../../utils/jasmineHelpers");

var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _thesauris = _interopRequireDefault(require("../thesauris.js"));
var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}






describe('thesauris', () => {
  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad(_fixtures.default);
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  describe('get()', () => {
    it('should return all thesauris including entity templates as options', async () => {
      const dictionaties = await _thesauris.default.get(null, 'es');
      expect(dictionaties.length).toBe(6);
      expect(dictionaties[0].name).toBe('dictionary');
      expect(dictionaties[1].name).toBe('dictionary 2');
      expect(dictionaties[4].name).toBe('entityTemplate');
      expect(dictionaties[4].values).toEqual([{
        id: 'sharedId',
        label: 'spanish entity',
        icon: 'Icon',
        type: 'entity' }]);

      expect(dictionaties[4].type).toBe('template');
    });

    it('should return all thesauris including unpublished documents if user', async () => {
      const dictionaties = await _thesauris.default.get(null, 'es', 'user');
      expect(dictionaties.length).toBe(6);
      expect(dictionaties[4].values).toEqual([
      { id: 'sharedId', label: 'spanish entity', icon: 'Icon', type: 'entity' },
      { id: 'other', label: 'unpublished entity', type: 'entity' }]);

    });

    describe('when passing id', () => {
      it('should return matching thesauri', async () => {
        const response = await _thesauris.default.get(_fixtures.dictionaryId);
        expect(response[0].name).toBe('dictionary 2');
        expect(response[0].values[0].label).toBe('value 1');
        expect(response[0].values[1].label).toBe('value 2');
      });
    });
  });

  describe('dictionaries()', () => {
    it('should return all dictionaries', async () => {
      const dictionaties = await _thesauris.default.dictionaries();
      expect(dictionaties.length).toBe(4);
      expect(dictionaties[0].name).toBe('dictionary');
      expect(dictionaties[1].name).toBe('dictionary 2');
      expect(dictionaties[2].name).toBe('Top 2 scify books');
      expect(dictionaties[3].name).toBe('Top movies');
    });

    describe('when passing a query', () => {
      it('should return matching thesauri', async () => {
        const response = await _thesauris.default.dictionaries({ _id: _fixtures.dictionaryId });
        expect(response.length).toBe(1);
        expect(response[0].name).toBe('dictionary 2');
        expect(response[0].values[0].label).toBe('value 1');
        expect(response[0].values[1].label).toBe('value 2');
      });
    });
  });

  describe('delete()', () => {
    let templatesCountSpy;
    beforeEach(() => {
      templatesCountSpy = spyOn(_templates.default, 'countByThesauri').and.returnValue(Promise.resolve(0));
      spyOn(_translations.default, 'deleteContext').and.returnValue(Promise.resolve());
    });

    it('should delete a thesauri', done => _thesauris.default.delete(_fixtures.dictionaryId).
    then(response => {
      expect(response.ok).toBe(true);
      return _thesauris.default.get({ _id: _fixtures.dictionaryId });
    }).
    then(dictionaries => {
      expect(dictionaries.length).toBe(0);
      done();
    }).
    catch((0, _jasmineHelpers.catchErrors)(done)));

    it('should delete the translation', async () => {
      const response = await _thesauris.default.delete(_fixtures.dictionaryId);
      expect(response.ok).toBe(true);
      expect(_translations.default.deleteContext).toHaveBeenCalledWith(_fixtures.dictionaryId);
    });

    describe('when the dictionary is in use', () => {
      it('should return an error in the response', done => {
        templatesCountSpy.and.returnValue(Promise.resolve(1));
        _thesauris.default.delete(_fixtures.dictionaryId).
        then((0, _jasmineHelpers.catchErrors)(done)).
        catch(response => {
          expect(response.key).toBe('templates_using_dictionary');
          done();
        });
      });
    });
  });

  describe('save', () => {
    beforeEach(() => {
      spyOn(_translations.default, 'updateContext').and.returnValue(Promise.resolve());
    });

    it('should create a thesauri', async () => {
      const _id = _testing_db.default.id();
      const data = { name: 'Batman wish list', values: [{ _id, id: '1', label: 'Joker BFF' }] };

      const response = await _thesauris.default.save(data);
      expect(response.values).toEqual([{ _id, id: '1', label: 'Joker BFF' }]);
    });

    it('should create a translation context', async () => {
      const data = { name: 'Batman wish list',
        values: [
        { id: '1', label: 'Joker BFF' },
        { label: 'Heroes',
          values: [
          { id: '2', label: 'Batman' },
          { id: '3', label: 'Robin' }] }] };



      spyOn(_translations.default, 'addContext').and.returnValue(Promise.resolve());
      const response = await _thesauris.default.save(data);
      expect(_translations.default.addContext).toHaveBeenCalledWith(
      response._id,
      'Batman wish list',
      {
        Batman: 'Batman',
        'Batman wish list': 'Batman wish list',
        Heroes: 'Heroes',
        'Joker BFF': 'Joker BFF',
        Robin: 'Robin' },

      'Dictionary');

    });

    it('should set a default value of [] to values property if its missing', done => {
      const data = { name: 'Scarecrow nightmares' };

      _thesauris.default.save(data).
      then(() => _thesauris.default.get()).
      then(response => {
        const newThesauri = response.find(thesauri => thesauri.name === 'Scarecrow nightmares');

        expect(newThesauri.name).toBe('Scarecrow nightmares');
        expect(newThesauri.values).toEqual([]);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when passing _id', () => {
      it('should edit an existing one', done => {
        spyOn(_translations.default, 'addContext').and.returnValue(Promise.resolve());
        const data = { _id: _fixtures.dictionaryId, name: 'changed name' };
        return _thesauris.default.save(data).
        then(() => _thesauris.default.getById(_fixtures.dictionaryId)).
        then(edited => {
          expect(edited.name).toBe('changed name');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should update the translation', done => {
        const data = {
          _id: _fixtures.dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [
          { id: _fixtures.dictionaryValueId, label: 'Marios game' }] };


        return _thesauris.default.save(data).
        then(response => {
          expect(_translations.default.updateContext).
          toHaveBeenCalledWith(
          response._id,
          'Top 1 games',
          { 'Enders game': 'Marios game', 'Top 2 scify books': 'Top 1 games' },
          ['Fundation'],
          { 'Top 1 games': 'Top 1 games', 'Marios game': 'Marios game' },
          'Dictionary');

          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should remove deleted values from entities', async () => {
        spyOn(_entities.default, 'deleteEntityFromMetadata');
        const data = {
          _id: _fixtures.dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [{ id: _fixtures.dictionaryValueId, label: 'Marios game' }] };


        await _thesauris.default.save(data);
        expect(_entities.default.deleteEntityFromMetadata.calls.count()).toBe(1);
        expect(_entities.default.deleteEntityFromMetadata).toHaveBeenCalledWith(
        '2',
        _fixtures.dictionaryIdToTranslate);

      });

      it('should properly delete values when thesauris have subgroups', async () => {
        spyOn(_entities.default, 'deleteEntityFromMetadata');
        const thesauri = await _thesauris.default.getById(_fixtures.dictionaryWithValueGroups);
        thesauri.values = thesauri.values.filter(value => value.id !== '3');

        await _thesauris.default.save(thesauri);

        const deletedValuesFromEntities = _entities.default.deleteEntityFromMetadata.
        calls.allArgs().map(args => args[0]);

        expect(deletedValuesFromEntities).toEqual(['3']);
      });
    });

    describe('validation', () => {
      describe('when trying to save a duplicated thesauri', () => {
        it('should return an error', async () => {
          const data = { name: 'dictionary' };

          let error;
          try {
            await _thesauris.default.save(data);
          } catch (e) {
            error = e;
          }

          expect(error).toBeDefined();
        });

        it('should not fail when name is contained as substring on another thesauri name', async () => {
          const data = { name: 'ary' };

          const thesauri = await _thesauris.default.save(data);
          expect(thesauri.name).toBe('ary');
        });

        it('should fail if the name is blank', async () => {
          let data = { values: [{ label: 'test' }] };
          try {
            await _thesauris.default.save(data);
            fail('should throw error');
          } catch (e) {
            expect(e).toBeDefined();
          }

          data = { name: '', values: [{ label: 'test' }] };
          try {
            await _thesauris.default.save(data);
            fail('should throw error');
          } catch (e) {
            expect(e).toBeDefined();
          }
        });
      });

      describe('when passing a blank value', () => {
        it('should return an error', async () => {
          const data = {
            name: 'thesauri_with_blank_value',
            values: [
            {
              label: '' }] };




          let error;
          try {
            await _thesauris.default.save(data);
          } catch (e) {
            error = e;
          }

          expect(error).toBeDefined();
        });
      });
    });
  });
});