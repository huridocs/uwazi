/* eslint-disable max-lines */
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import translations from '#api/i18n/translations.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import { search } from '#api/search/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingDB } from '#api/utils/testing_db.js';
import { thesauri } from '../thesauri.js';
import { fixtures, dictionaryId } from './fixtures.js';

const factory = getFixturesFactory();

describe('thesauri', () => {
  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    search.indexEntities.mockRestore();
    await testingEnvironment.tearDown();
  });

  describe('get()', () => {
    it('should return all thesauri including entity templates as options', async () => {
      await testingEnvironment.runWithContext(async () => {
        search.indexEntities.mockRestore();
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
    });

    it('should return all thesauri including unpublished documents if user', async () => {
      await testingEnvironment.runWithContext(async () => {
        const elasticIndex = 'thesauri.spec.elastic.index';
        await testingDB.setupFixturesAndContext(fixtures, elasticIndex);
        const dictionaries = await thesauri.get(null, 'es', 'user');
        expect(dictionaries.length).toBe(6);
        expect(dictionaries[4].values.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
          { id: 'other', label: 'unpublished entity' },
          { id: 'sharedId', label: 'spanish entity', icon: { type: 'Icon' } },
          { id: 'sharedId2' },
        ]);
      });
    });

    describe('when passing id', () => {
      it('should return matching thesauri', async () => {
        await testingEnvironment.runWithContext(async () => {
          const response = await thesauri.get(dictionaryId);
          expect(response[0].name).toBe('dictionary 2');
          expect(response[0].values[0].label).toBe('value 1');
          expect(response[0].values[1].label).toBe('Parent');
          expect(response[0].values[1].values[0].label).toBe('value 2');
        });
      });
    });
  });

  describe('find()', () => {
    it('should return all thesauri', async () => {
      const { rows } = await thesauri.find();

      expect(rows[0]).toMatchObject({ _id: expect.any(ObjectId), name: 'dictionary' });

      expect(rows[1]).toMatchObject({
        _id: expect.any(ObjectId),
        name: 'dictionary 2',
        values: [
          { id: '1', label: 'value 1' },
          { id: '3', label: 'Parent', values: [{ id: '2', label: 'value 2' }] },
        ],
      });
    });

    it('should find by id', async () => {
      const query = {
        _id: testingDB.id(dictionaryId),
      };

      const { rows } = await thesauri.find(query);

      expect(rows.length).toBe(1);

      expect(rows[0]).toMatchObject({
        _id: query._id,
        name: 'dictionary 2',
        values: [
          { id: '1', label: 'value 1' },
          { id: '3', label: 'Parent', values: [{ id: '2', label: 'value 2' }] },
        ],
      });
    });
  });

  const getById = id => testingEnvironment.runWithContext(() => thesauri.getById(id));
  const saveThesauri = async data => testingEnvironment.runWithContext(() => thesauri.save(data));

  describe('save', () => {
    it('should create a thesauri', async () => {
      const data = { name: 'Batman wish list', values: [{ label: 'Joker BFF' }] };

      const response = await saveThesauri(data);
      expect(response.name).toBe('Batman wish list');
      expect(response.values).toHaveLength(1);
      expect(response.values[0].label).toBe('Joker BFF');
    });

    it('should set a default value of [] to values property if its missing', async () => {
      await testingEnvironment.runWithContext(async () => {
        const data = { name: 'Scarecrow nightmares' };

        await thesauri.save(data);
        const response = await thesauri.get();
        const newThesauri = response.find(thesaurus => thesaurus.name === 'Scarecrow nightmares');

        expect(newThesauri.name).toBe('Scarecrow nightmares');
        expect(newThesauri.values).toEqual([]);
      });
    });

    describe('when passing _id', () => {
      it('should edit an existing one', async () => {
        const data = { _id: dictionaryId, name: 'changed name' };
        await saveThesauri(data);

        const edited = await getById(dictionaryId);
        expect(edited.name).toBe('changed name');
      });
    });

    describe('validation', () => {
      describe('when trying to save a duplicated thesauri', () => {
        it('should return an error', async () => {
          const data = { name: 'dictionary' };

          let error;
          try {
            await saveThesauri(data);
          } catch (e) {
            error = e;
          }

          expect(error).toBeDefined();
        });

        it('should not fail when name is contained as substring on another thesauri name', async () => {
          const data = { name: 'ary' };

          const thesaurus = await saveThesauri(data);
          expect(thesaurus.name).toBe('ary');
        });

        it('should fail if the name is blank', async () => {
          let data = { values: [{ label: 'test' }] };
          try {
            await saveThesauri(data);
            fail('should throw error');
          } catch (e) {
            expect(e).toBeDefined();
          }

          data = { name: '', values: [{ label: 'test' }] };
          try {
            await saveThesauri(data);
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
            await saveThesauri(data);
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
            await saveThesauri(toSave);
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

          const response = await saveThesauri(toSave);
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
    let translationsV2Collection;

    beforeEach(async () => {
      translationsV2Collection = testingDB.mongodb.collection('translationsV2');
    });

    describe('when the name of thesaurus is updated', () => {
      it('should update the translations key', async () => {
        await testingEnvironment.runWithContext(async () => {
          const data = { ...fixtures.dictionaries[1], name: 'new name' };
          const response = await thesauri.save(data);
          data.values.push({ id: '3', label: 'value 3' });
          await thesauri.save(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': response._id.toString(),
            })
            .toArray();
          expect(relatedTranslations.find(t => t.key === 'new name')).toBeDefined();
        });
      });
    });

    describe('when changing elements', () => {
      describe('creating new elements', () => {
        it('should create the translation key', async () => {
          const data = {
            name: 'Test Thesaurus',
            values: [{ id: '1', label: 'A' }],
          };
          const response = await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': response._id.toString(),
            })
            .toArray();

          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es' },
            { key: 'A', language: 'en' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
          ]);
        });

        it('should not try to duplicate a translation', async () => {
          const data = {
            name: 'Test Thesaurus',
            values: [{ id: '1', label: 'A' }],
          };
          const response = await saveThesauri(data);
          const id = response._id.toString();
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'es',
            },
            { $set: { value: 'Aes' } }
          );
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'en',
            },
            { $set: { value: 'Aen' } }
          );

          data._id = id;
          data.values.push({ id: '2', label: 'group', values: [{ id: '3', label: 'A' }] });
          await saveThesauri(data);

          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();

          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es', value: 'Aes' },
            { key: 'A', language: 'en', value: 'Aen' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });
      });

      describe('deleting elements', () => {
        let id;

        beforeEach(async () => {
          const thesaurusData = {
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'A' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'A' }] },
            ],
          };
          const response = await saveThesauri(thesaurusData);
          id = response._id.toString();
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'es',
            },
            { $set: { value: 'Aes' } }
          );
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'en',
            },
            { $set: { value: 'Aen' } }
          );
        });

        it('should not delete the translation key if it is still used by another element', async () => {
          let relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es', value: 'Aes' },
            { key: 'A', language: 'en', value: 'Aen' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
          const data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [{ id: '1', label: 'A' }],
          };
          await saveThesauri(data);
          relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es', value: 'Aes' },
            { key: 'A', language: 'en', value: 'Aen' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
          ]);
        });

        it('should delete the translation key if it is not used by another element', async () => {
          const data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [{ id: '2', label: 'group' }],
          };
          await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });
      });

      describe('updating elements', () => {
        let id;

        beforeEach(async () => {
          const thesaurusData = {
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'A' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'A' }] },
              { id: '4', label: 'C' },
            ],
          };
          const response = await saveThesauri(thesaurusData);
          id = response._id.toString();
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'es',
            },
            { $set: { value: 'Aes' } }
          );
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'A',
              language: 'en',
            },
            { $set: { value: 'Aen' } }
          );
          await translationsV2Collection.updateOne(
            {
              'context.id': id,
              key: 'C',
              language: 'es',
            },
            { $set: { value: 'Ces' } }
          );
        });

        it('should update the key, but change only the default language translation, when all of the same elements are changed at once', async () => {
          const data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'B' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'B' }] },
              { id: '4', label: 'C' },
            ],
          };
          await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'B', language: 'es', value: 'B' },
            { key: 'B', language: 'en', value: 'B' },
            { key: 'C', language: 'es', value: 'Ces' },
            { key: 'C', language: 'en', value: 'C' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });

        it('should add a new translations, when an element gets a new label, but the old one is still in use by other elements', async () => {
          const data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'A' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'B' }] },
              { id: '4', label: 'C' },
            ],
          };
          await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es', value: 'Aes' },
            { key: 'A', language: 'en', value: 'Aen' },
            { key: 'B', language: 'es', value: 'B' },
            { key: 'B', language: 'en', value: 'B' },
            { key: 'C', language: 'es', value: 'Ces' },
            { key: 'C', language: 'en', value: 'C' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });

        it('should add no new translation, when a label gets updated to another already existing label', async () => {
          const data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'A' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'C' }] },
              { id: '4', label: 'C' },
            ],
          };
          await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'A', language: 'es', value: 'Aes' },
            { key: 'A', language: 'en', value: 'Aen' },
            { key: 'C', language: 'es', value: 'Ces' },
            { key: 'C', language: 'en', value: 'C' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });

        it('should remove translations when the last element using it is changed to something else', async () => {
          let data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'A' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'B' }] },
              { id: '4', label: 'C' },
            ],
          };
          await saveThesauri(data);
          data = {
            _id: id,
            name: 'Test Thesaurus',
            values: [
              { id: '1', label: 'B' },
              { id: '2', label: 'group', values: [{ id: '3', label: 'B' }] },
              { id: '4', label: 'C' },
            ],
          };
          await saveThesauri(data);
          const relatedTranslations = await translationsV2Collection
            .find({
              'context.id': id,
            })
            .toArray();
          expect(relatedTranslations).toMatchObject([
            { key: 'B', language: 'es', value: 'B' },
            { key: 'B', language: 'en', value: 'B' },
            { key: 'C', language: 'es', value: 'Ces' },
            { key: 'C', language: 'en', value: 'C' },
            { key: 'Test Thesaurus', language: 'es' },
            { key: 'Test Thesaurus', language: 'en' },
            { key: 'group', language: 'es' },
            { key: 'group', language: 'en' },
          ]);
        });
      });
    });
  });

  describe('appendValues', () => {
    const base = factory.nestedThesauri('base_thesaurus', [
      '1',
      '2',
      {
        A: ['A1', 'A2'],
        B: ['B1'],
      },
    ]);

    it('should sanitize new value labels when appending', () => {
      const baseSimple = { values: [{ label: 'existing' }] };
      const addition = [
        { label: '  new   value  ' },
        { label: 'existing' }, // should not duplicate
        { label: '  another\nvalue  ' },
      ];
      const result = thesauri.appendValues(baseSimple, addition);
      expect(result.values).toEqual([
        { label: 'existing' },
        { label: 'new value' },
        { label: 'another value' },
      ]);
    });

    it.each([
      {
        case: 'add root value',
        addition: [
          {
            label: '3',
          },
        ],
        expectedValues: [
          ...base.values,
          {
            label: '3',
          },
        ],
      },
      {
        case: 'add root values',
        addition: [
          {
            label: '3',
          },
          {
            label: '4',
          },
        ],
        expectedValues: [
          ...base.values,
          {
            label: '3',
          },
          {
            label: '4',
          },
        ],
      },
      {
        case: 'add group',
        addition: [
          {
            label: 'C',
            values: [
              {
                label: 'C3',
              },
            ],
          },
        ],
        expectedValues: [
          ...base.values,
          {
            label: 'C',
            values: [
              {
                label: 'C3',
              },
            ],
          },
        ],
      },
      {
        case: 'add groups',
        addition: [
          {
            label: 'C',
            values: [
              {
                label: 'C3',
              },
            ],
          },
          {
            label: 'D',
            values: [
              {
                label: 'D1',
              },
              {
                label: 'D2',
              },
            ],
          },
        ],
        expectedValues: [
          ...base.values,
          {
            label: 'C',
            values: [
              {
                label: 'C3',
              },
            ],
          },
          {
            label: 'D',
            values: [
              {
                label: 'D1',
              },
              {
                label: 'D2',
              },
            ],
          },
        ],
      },
      {
        case: 'append to group',
        addition: [
          {
            label: 'A',
            values: [
              {
                label: 'A3',
              },
              {
                label: 'A4',
              },
            ],
          },
          {
            label: 'B',
            values: [
              {
                label: 'B2',
              },
            ],
          },
        ],
        expectedValues: [
          base.values[0],
          base.values[1],
          {
            label: 'A',
            values: [
              ...base.values[2].values,
              {
                label: 'A3',
              },
              {
                label: 'A4',
              },
            ],
          },
          {
            label: 'B',
            values: [
              ...base.values[3].values,
              {
                label: 'B2',
              },
            ],
          },
        ],
      },
      {
        case: 'not add repeated root values',
        addition: [
          {
            label: '1',
          },
        ],
        expectedValues: base.values,
      },
      {
        case: 'not add repeated group values',
        addition: [
          {
            label: 'A',
            values: [
              {
                label: 'A1',
              },
            ],
          },
        ],
        expectedValues: base.values,
      },
      {
        case: 'should ignore case when checking for repetition',
        addition: [
          {
            label: 'a',
            values: [
              {
                label: 'A1',
              },
            ],
          },
          {
            label: 'A',
            values: [
              {
                label: 'a1',
              },
            ],
          },
        ],
        expectedValues: base.values,
      },
      {
        case: 'ignore case in the addition',
        addition: [{ label: 'root' }, { label: 'Root' }, { label: 'ROOT' }],
        expectedValues: [...base.values, { label: 'root' }],
      },
      {
        case: 'split group additions and properly ignore case when needed',
        addition: [
          { label: 'A', values: [{ label: 'a2' }, { label: 'A3' }, { label: 'a3' }] },
          { label: 'a', values: [{ label: 'a3' }, { label: 'A4' }] },
          { label: 'C', values: [{ label: 'C1' }, { label: 'c1' }] },
          { label: 'C', values: [{ label: 'c1' }, { label: 'C2' }, { label: 'c1' }] },
        ],
        expectedValues: [
          base.values[0],
          base.values[1],
          { label: 'A', values: [...base.values[2].values, { label: 'A3' }, { label: 'A4' }] },
          base.values[3],
          { label: 'C', values: [{ label: 'C1' }, { label: 'C2' }] },
        ],
      },
      {
        case: 'handle complex cases',
        addition: [
          { label: '2' },
          { label: '3' },
          { label: 'a', values: [{ label: 'A3' }] },
          { label: 'B', values: [{ label: 'b1' }, { label: 'B2' }] },
          { label: 'C', values: [{ label: 'C1' }, { label: 'C2' }] },
        ],
        expectedValues: [
          base.values[0],
          base.values[1],
          { label: 'A', values: [...base.values[2].values, { label: 'A3' }] },
          { label: 'B', values: [...base.values[3].values, { label: 'B2' }] },
          { label: '3' },
          { label: 'C', values: [{ label: 'C1' }, { label: 'C2' }] },
        ],
      },
    ])('should $case', async ({ addition, expectedValues }) => {
      const baseClone = _.cloneDeep(base);
      const modified = thesauri.appendValues(baseClone, addition);
      expect(modified.values).toMatchObject(expectedValues);
      expect(baseClone).toEqual(base);
    });
  });
});
