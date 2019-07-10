import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import { catchErrors } from 'api/utils/jasmineHelpers';

import db from 'api/utils/testing_db';
import thesauris from '../thesauris.js';
import fixtures, {
  dictionaryId,
  dictionaryIdToTranslate,
  dictionaryValueId,
  dictionaryWithValueGroups,
} from './fixtures.js';

describe('thesauris', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('get()', () => {
    it('should return all thesauris including entity templates as options', async () => {
      const dictionaties = await thesauris.get(null, 'es');
      expect(dictionaties.length).toBe(6);
      expect(dictionaties[0].name).toBe('dictionary');
      expect(dictionaties[1].name).toBe('dictionary 2');
      expect(dictionaties[4].name).toBe('entityTemplate');
      expect(dictionaties[4].values).toEqual([{
        id: 'sharedId',
        label: 'spanish entity',
        icon: 'Icon',
        type: 'entity'
      }]);
      expect(dictionaties[4].type).toBe('template');
    });

    it('should return only published documents for as options for template thesauri', async () => {
      const dictionaties = await thesauris.get(null, 'es');
      expect(dictionaties.length).toBe(6);
      expect(dictionaties[4].values).toEqual([
        { id: 'sharedId', label: 'spanish entity', icon: 'Icon', type: 'entity' }
      ]);
    });

    describe('when passing id', () => {
      it('should return matching thesauri', async () => {
        const response = await thesauris.get(dictionaryId);
        expect(response[0].name).toBe('dictionary 2');
        expect(response[0].values[0].label).toBe('value 1');
        expect(response[0].values[1].label).toBe('value 2');
      });
    });
  });

  describe('dictionaries()', () => {
    it('should return all dictionaries', async () => {
      const dictionaties = await thesauris.dictionaries();
      expect(dictionaties.length).toBe(4);
      expect(dictionaties[0].name).toBe('dictionary');
      expect(dictionaties[1].name).toBe('dictionary 2');
      expect(dictionaties[2].name).toBe('Top 2 scify books');
      expect(dictionaties[3].name).toBe('Top movies');
    });

    describe('when passing a query', () => {
      it('should return matching thesauri', async () => {
        const response = await thesauris.dictionaries({ _id: dictionaryId });
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
      templatesCountSpy = spyOn(templates, 'countByThesauri').and.returnValue(Promise.resolve(0));
      spyOn(translations, 'deleteContext').and.returnValue(Promise.resolve());
    });

    it('should delete a thesauri', done => thesauris.delete(dictionaryId)
    .then((response) => {
      expect(response.ok).toBe(true);
      return thesauris.get({ _id: dictionaryId });
    })
    .then((dictionaries) => {
      expect(dictionaries.length).toBe(0);
      done();
    })
    .catch(catchErrors(done)));

    it('should delete the translation', async () => {
      const response = await thesauris.delete(dictionaryId);
      expect(response.ok).toBe(true);
      expect(translations.deleteContext).toHaveBeenCalledWith(dictionaryId);
    });

    describe('when the dictionary is in use', () => {
      it('should return an error in the response', (done) => {
        templatesCountSpy.and.returnValue(Promise.resolve(1));
        thesauris.delete(dictionaryId)
        .then(catchErrors(done))
        .catch((response) => {
          expect(response.key).toBe('templates_using_dictionary');
          done();
        });
      });
    });
  });

  describe('save', () => {
    beforeEach(() => {
      spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
    });

    it('should create a thesauri', async () => {
      const _id = db.id();
      const data = { name: 'Batman wish list', values: [{ _id, id: '1', label: 'Joker BFF' }] };

      const response = await thesauris.save(data);
      expect(response.values).toEqual([{ _id, id: '1', label: 'Joker BFF' }]);
    });

    it('should create a translation context', async () => {
      const data = { name: 'Batman wish list',
        values: [
          { id: '1', label: 'Joker BFF' },
          { label: 'Heroes',
            values: [
              { id: '2', label: 'Batman' },
              { id: '3', label: 'Robin' }
            ]
          }
        ] };
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      const response = await thesauris.save(data);
      expect(translations.addContext).toHaveBeenCalledWith(
        response._id,
        'Batman wish list',
        {
          Batman: 'Batman',
          'Batman wish list': 'Batman wish list',
          Heroes: 'Heroes',
          'Joker BFF': 'Joker BFF',
          Robin: 'Robin'
        },
        'Dictionary'
      );
    });

    it('should set a default value of [] to values property if its missing', (done) => {
      const data = { name: 'Scarecrow nightmares' };

      thesauris.save(data)
      .then(() => thesauris.get())
      .then((response) => {
        const newThesauri = response.find(thesauri => thesauri.name === 'Scarecrow nightmares');

        expect(newThesauri.name).toBe('Scarecrow nightmares');
        expect(newThesauri.values).toEqual([]);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing _id', () => {
      it('should edit an existing one', (done) => {
        spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
        const data = { _id: dictionaryId, name: 'changed name' };
        return thesauris.save(data)
        .then(() => thesauris.getById(dictionaryId))
        .then((edited) => {
          expect(edited.name).toBe('changed name');
          done();
        })
        .catch(catchErrors(done));
      });

      it('should update the translation', (done) => {
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [
            { id: dictionaryValueId, label: 'Marios game' }
          ]
        };
        return thesauris.save(data)
        .then((response) => {
          expect(translations.updateContext)
          .toHaveBeenCalledWith(
            response._id,
            'Top 1 games',
            { 'Enders game': 'Marios game', 'Top 2 scify books': 'Top 1 games' },
            ['Fundation'],
            { 'Top 1 games': 'Top 1 games', 'Marios game': 'Marios game' },
            'Dictionary'
          );
          done();
        })
        .catch(catchErrors(done));
      });

      it('should remove deleted values from entities', async () => {
        spyOn(entities, 'deleteEntityFromMetadata');
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [{ id: dictionaryValueId, label: 'Marios game' }]
        };

        await thesauris.save(data);
        expect(entities.deleteEntityFromMetadata.calls.count()).toBe(1);
        expect(entities.deleteEntityFromMetadata).toHaveBeenCalledWith(
          '2',
          dictionaryIdToTranslate
        );
      });

      it('should properly delete values when thesauris have subgroups', async () => {
        spyOn(entities, 'deleteEntityFromMetadata');
        const thesauri = await thesauris.getById(dictionaryWithValueGroups);
        thesauri.values = thesauri.values.filter(value => value.id !== '3');

        await thesauris.save(thesauri);

        const deletedValuesFromEntities = entities.deleteEntityFromMetadata
        .calls.allArgs().map(args => args[0]);

        expect(deletedValuesFromEntities).toEqual(['3']);
      });
    });

    describe('when trying to save a duplicated thesauri', () => {
      it('should return an error', (done) => {
        const data = { name: 'dictionary' };
        thesauris.save(data)
        .then(catchErrors(done))
        .catch((response) => {
          expect(response).toBe('duplicated_entry');
          done();
        });
      });
    });
  });
});
