/* eslint-disable max-lines */
import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';
import entities from 'api/entities/entities';
import { search } from 'api/search';
import { catchErrors } from 'api/utils/jasmineHelpers';

import { testingDB } from 'api/utils/testing_db';
import thesauri from '../thesauri.js';
import {
  fixtures,
  dictionaryId,
  dictionaryIdToTranslate,
  dictionaryValueId,
  dictionaryWithValueGroups,
} from './fixtures';

describe('thesauri', () => {
  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.callFake(async () => Promise.resolve());
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('get()', () => {
    it('should return all thesauri including entity templates as options', async () => {
      search.indexEntities.and.callThrough();
      const elasticIndex = 'thesauri.spec.elastic.index';
      await testingDB.setupFixturesAndContext(fixtures, elasticIndex);
      const thesaurus = await thesauri.get(null, 'es');

      expect(thesaurus[0]).toMatchObject({ name: 'dictionary' });
      expect(thesaurus[1]).toMatchObject({ name: 'dictionary 2' });

      expect(thesaurus[4]).toMatchObject({
        name: 'entityTemplate',
        values: [{ label: 'spanish entity' }],
        optionsCount: 3,
      });

      expect(thesaurus[5]).toMatchObject({
        name: 'documentTemplate',
        values: [{ label: 'document' }, { label: 'document 2' }],
        optionsCount: 2,
      });
    });

    it('should return all thesauri including unpublished documents if user', async () => {
      const dictionaries = await thesauri.get(null, 'es', 'user');
      expect(dictionaries.length).toBe(6);
      expect(dictionaries[4].values.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
        { id: 'other', label: 'unpublished entity' },
        { id: 'sharedId', label: 'spanish entity', icon: { type: 'Icon' } },
        { id: 'sharedId2' },
      ]);
    });

    describe('when passing id', () => {
      it('should return matching thesauri', async () => {
        const response = await thesauri.get(dictionaryId);
        expect(response[0].name).toBe('dictionary 2');
        expect(response[0].values[0].label).toBe('value 1');
        expect(response[0].values[1].label).toBe('Parent');
        expect(response[0].values[1].values[0].label).toBe('value 2');
      });
    });
  });

  describe('dictionaries()', () => {
    it('should return all dictionaries', async () => {
      const dictionaries = await thesauri.dictionaries();
      expect(dictionaries.length).toBe(4);
      expect(dictionaries[0].name).toBe('dictionary');
      expect(dictionaries[1].name).toBe('dictionary 2');
      expect(dictionaries[2].name).toBe('Top 2 scify books');
      expect(dictionaries[3].name).toBe('Top movies');
    });

    describe('when passing a query', () => {
      it('should return matching thesauri', async () => {
        const response = await thesauri.dictionaries({ _id: dictionaryId });
        expect(response.length).toBe(1);
        expect(response[0].name).toBe('dictionary 2');
        expect(response[0].values[0].label).toBe('value 1');
        expect(response[0].values[1].label).toBe('Parent');
        expect(response[0].values[1].values[0].label).toBe('value 2');
      });
    });
  });

  describe('delete()', () => {
    let templatesCountSpy;
    beforeEach(() => {
      templatesCountSpy = spyOn(templates, 'countByThesauri').and.callFake(async () => {
        Promise.resolve(0);
      });
      spyOn(translations, 'deleteContext').and.callFake(async () => Promise.resolve());
    });

    it('should delete a thesauri', done =>
      thesauri
        .delete(dictionaryId)
        .then(response => {
          expect(response.ok).toBe(true);
          return thesauri.get({ _id: dictionaryId });
        })
        .then(dictionaries => {
          expect(dictionaries.length).toBe(0);
          done();
        })
        .catch(catchErrors(done)));

    it('should delete the translation', async () => {
      const response = await thesauri.delete(dictionaryId);
      expect(response.ok).toBe(true);
      expect(translations.deleteContext).toHaveBeenCalledWith(dictionaryId);
    });

    describe('when the dictionary is in use', () => {
      it('should return an error in the response', done => {
        templatesCountSpy.and.callFake(async () => Promise.resolve(1));
        thesauri
          .delete(dictionaryId)
          .then(catchErrors(done))
          .catch(response => {
            expect(response.key).toBe('templates_using_dictionary');
            done();
          });
      });
    });
  });

  describe('save', () => {
    beforeEach(() => {
      spyOn(translations, 'updateContext').and.callFake(async () => Promise.resolve());
    });

    it('should create a thesauri', async () => {
      const _id = testingDB.id();
      const data = { name: 'Batman wish list', values: [{ _id, id: '1', label: 'Joker BFF' }] };

      const response = await thesauri.save(data);
      expect(response.values).toEqual([{ _id, id: '1', label: 'Joker BFF' }]);
    });

    it('should create a translation context', async () => {
      const data = {
        name: 'Batman wish list',
        values: [
          { id: '1', label: 'Joker BFF' },
          {
            label: 'Heroes',
            values: [
              { id: '2', label: 'Batman' },
              { id: '3', label: 'Robin' },
            ],
          },
        ],
      };
      spyOn(translations, 'addContext').and.callFake(async () => Promise.resolve());
      const response = await thesauri.save(data);
      expect(translations.addContext).toHaveBeenCalledWith(
        response._id,
        'Batman wish list',
        {
          Batman: 'Batman',
          'Batman wish list': 'Batman wish list',
          Heroes: 'Heroes',
          'Joker BFF': 'Joker BFF',
          Robin: 'Robin',
        },
        'Thesaurus'
      );
    });

    it('should set a default value of [] to values property if its missing', done => {
      const data = { name: 'Scarecrow nightmares' };

      thesauri
        .save(data)
        .then(() => thesauri.get())
        .then(response => {
          const newThesauri = response.find(thesaurus => thesaurus.name === 'Scarecrow nightmares');

          expect(newThesauri.name).toBe('Scarecrow nightmares');
          expect(newThesauri.values).toEqual([]);
          done();
        })
        .catch(catchErrors(done));
    });

    describe('when passing _id', () => {
      it('should edit an existing one', done => {
        spyOn(translations, 'addContext').and.callFake(async () => Promise.resolve());
        const data = { _id: dictionaryId, name: 'changed name' };
        return thesauri
          .save(data)
          .then(() => thesauri.getById(dictionaryId))
          .then(edited => {
            expect(edited.name).toBe('changed name');
            done();
          })
          .catch(catchErrors(done));
      });

      it('should update the translation', done => {
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [{ id: dictionaryValueId, label: 'Marios game' }],
        };
        return thesauri
          .save(data)
          .then(response => {
            expect(translations.updateContext).toHaveBeenCalledWith(
              response._id,
              'Top 1 games',
              { 'Enders game': 'Marios game', 'Top 2 scify books': 'Top 1 games' },
              ['Fundation'],
              { 'Top 1 games': 'Top 1 games', 'Marios game': 'Marios game' },
              'Thesaurus'
            );
            done();
          })
          .catch(catchErrors(done));
      });

      it('should remove deleted values from entities', async () => {
        spyOn(entities, 'deleteThesaurusFromMetadata');
        const data = {
          _id: dictionaryIdToTranslate,
          name: 'Top 1 games',
          values: [{ id: dictionaryValueId, label: 'Marios game' }],
        };

        await thesauri.save(data);
        expect(entities.deleteThesaurusFromMetadata.calls.count()).toBe(1);
        expect(entities.deleteThesaurusFromMetadata).toHaveBeenCalledWith(
          '2',
          dictionaryIdToTranslate
        );
      });

      it('should properly delete values when thesauri have subgroups', async () => {
        spyOn(entities, 'deleteThesaurusFromMetadata');
        const thesaurus = await thesauri.getById(dictionaryWithValueGroups);
        thesaurus.values = thesaurus.values.filter(value => value.id !== '3');

        await thesauri.save(thesaurus);

        const deletedValuesFromEntities = entities.deleteThesaurusFromMetadata.calls
          .allArgs()
          .map(args => args[0]);

        expect(deletedValuesFromEntities).toEqual(['3']);
      });

      it('should update labels on entities with the thesauri values', async () => {
        const thesaurus = {
          name: 'dictionary 2',
          _id: dictionaryId,
          values: [
            { id: '1', label: 'value 1 changed' },
            { id: '3', label: 'Parent', values: [{ id: '2', label: 'value 2' }] },
          ],
        };

        await thesauri.save(thesaurus);

        const changedEntities = await entities.get({ language: 'es' });

        expect(changedEntities[0].metadata).toEqual(
          expect.objectContaining({
            multiselect: [{ value: '1', label: 'value 1 changed' }],
          })
        );
        expect(changedEntities[1].metadata).toEqual(
          expect.objectContaining({
            multiselect: [
              { value: '1', label: 'value 1 changed' },
              { value: '2', label: 'value 2', parent: { value: '3', label: 'Parent' } },
            ],
          })
        );
      });

      it('should update parent label on entities with child values', async () => {
        const thesaurus = {
          name: 'dictionary 2',
          _id: dictionaryId,
          values: [
            { id: '1', label: 'value 1' },
            { id: '3', label: 'Parent changed', values: [{ id: '2', label: 'value 2' }] },
          ],
        };

        await thesauri.save(thesaurus);

        const changedEntities = await entities.get({ language: 'es' });

        expect(changedEntities[0].metadata).toEqual(
          expect.objectContaining({
            multiselect: [{ value: '1', label: 'value 1' }],
          })
        );

        expect(changedEntities[1].metadata).toEqual(
          expect.objectContaining({
            multiselect: [
              { value: '1', label: 'value 1' },
              { value: '2', label: 'value 2', parent: { value: '3', label: 'Parent changed' } },
            ],
          })
        );
      });
    });

    describe('validation', () => {
      describe('when trying to save a duplicated thesauri', () => {
        it('should return an error', async () => {
          const data = { name: 'dictionary' };

          let error;
          try {
            await thesauri.save(data);
          } catch (e) {
            error = e;
          }

          expect(error).toBeDefined();
        });

        it('should not fail when name is contained as substring on another thesauri name', async () => {
          const data = { name: 'ary' };

          const thesaurus = await thesauri.save(data);
          expect(thesaurus.name).toBe('ary');
        });

        it('should fail if the name is blank', async () => {
          let data = { values: [{ label: 'test' }] };
          try {
            await thesauri.save(data);
            fail('should throw error');
          } catch (e) {
            expect(e).toBeDefined();
          }

          data = { name: '', values: [{ label: 'test' }] };
          try {
            await thesauri.save(data);
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
                label: '',
              },
            ],
          };

          let error;
          try {
            await thesauri.save(data);
          } catch (e) {
            error = e;
          }

          expect(error).toBeDefined();
        });
      });

      describe('when trying to save duplicated labels', () => {
        it.each([
          {
            case: 'root',
            values: [
              { label: 'duplicated_label' },
              { label: 'other_label' },
              { label: 'duplicated_label' },
            ],
          },
          {
            case: 'group',
            values: [
              {
                label: 'group',
                values: [
                  { label: 'duplicated_label' },
                  { label: 'other_label' },
                  { label: 'duplicated_label' },
                ],
              },
            ],
          },
        ])('should not allow duplication in $case', async ({ values }) => {
          const toSave = { name: 'test_thesaurus', values };
          try {
            await thesauri.save(toSave);
            fail('should throw error');
          } catch (e) {
            expect(e).toBeDefined();
          }
        });

        it('should allow same labels in different groups and/or root', async () => {
          const toSave = {
            name: 'test_thesaurus',
            values: [
              { label: 'same_label' },
              { label: 'first_group', values: [{ label: 'same_label' }] },
              { label: 'second_group', values: [{ label: 'same_label' }] },
            ],
          };

          const response = await thesauri.save(toSave);
          expect(response).toMatchObject({
            _id: expect.anything(),
            name: 'test_thesaurus',
            values: [
              { label: 'same_label', id: expect.anything() },
              {
                label: 'first_group',
                id: expect.anything(),
                values: [{ label: 'same_label', id: expect.anything() }],
              },
              {
                label: 'second_group',
                id: expect.anything(),
                values: [{ label: 'same_label', id: expect.anything() }],
              },
            ],
          });
        });
      });
    });
  });

  describe('update', () => {
    describe('when the name of thesaurus is updated', () => {
      it('should update the translations key', async () => {
        const data = { ...fixtures.dictionaries[1], name: 'new name' };
        const response = await thesauri.save(data);
        data.values.push({ id: '3', label: 'value 3' });
        await thesauri.save(data);
        const allTranslations = await translations.get();
        const context = allTranslations[0].contexts.find(c => c.id === response._id.toString());

        expect(context.values['new name']).toBe('dictionary 2');
      });
    });
  });
});
