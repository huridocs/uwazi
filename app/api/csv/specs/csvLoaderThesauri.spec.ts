import db from 'api/utils/testing_db';
import thesauri from 'api/thesauri';
import translations from 'api/i18n';
import settings from 'api/settings';

import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { WithId } from 'api/odm';
import { IndexedContextValues } from 'api/i18n/translations';
import { CSVLoader } from '../csvLoader';
import { fixtures, thesauri1Id } from './fixtures';
import { mockCsvFileReadStream } from './helpers';

const getTranslation = async (lang: string, id: ObjectId) =>
  ((await translations.get()).find(t => t.locale === lang)?.contexts || []).find(
    c => c?.id === id?.toString()
  )?.values || ({} as IndexedContextValues);

describe('csvLoader thesauri', () => {
  const loader = new CSVLoader();

  afterAll(async () => db.disconnect());

  let thesauriId: ObjectId;
  let result: WithId<ThesaurusSchema>;
  describe('load thesauri', () => {
    beforeAll(async () => {
      await db.clearAllAndLoad(fixtures);

      await settings.addLanguage({ key: 'es', label: 'spanish' });
      await translations.addLanguage('es');

      await settings.addLanguage({ key: 'fr', label: 'french' });
      await translations.addLanguage('fr');

      const { _id } = await thesauri.save({
        name: 'thesauri2Id',
        values: [{ label: 'existing value' }],
      });

      const nonExistent = 'Russian';

      const csv = `English, Spanish, French  , ${nonExistent}  ,
                   value 1, valor 1, valeur 1, 1               ,
                   value 2, valor 2, valeur 2, 2               ,
                   value 3, valor 3, valeur 3, 3               ,`;

      thesauriId = _id;
      const mockedFile = mockCsvFileReadStream(csv);
      result = await loader.loadThesauri('mockedFileFromString', _id, { language: 'en' });
      mockedFile.mockRestore();
    });

    it('should set thesauri values using the language passed and ignore blank values', async () => {
      const thesaurus = await thesauri.getById(thesauriId);
      expect(thesaurus!.values!.map(v => v.label)).toEqual([
        'existing value',
        'value 1',
        'value 2',
        'value 3',
      ]);
    });

    it('should return the updated thesaurus', async () => {
      const thesaurus = await thesauri.getById(thesauriId);
      expect(thesaurus).toEqual(result);
    });

    it('should translate thesauri values to english', async () => {
      const english = await getTranslation('en', thesauriId);

      expect(Object.keys(english).length).toBe(5);

      expect(english.thesauri2Id).toBe('thesauri2Id');
      expect(english['existing value']).toBe('existing value');
      expect(english['value 1']).toBe('value 1');
      expect(english['value 2']).toBe('value 2');
      expect(english['value 3']).toBe('value 3');
    });

    it('should translate thesauri values to spanish', async () => {
      const spanish = await getTranslation('es', thesauriId);

      expect(Object.keys(spanish).length).toBe(5);

      expect(spanish.thesauri2Id).toBe('thesauri2Id');
      expect(spanish['existing value']).toBe('existing value');
      expect(spanish['value 1']).toBe('valor 1');
      expect(spanish['value 2']).toBe('valor 2');
      expect(spanish['value 3']).toBe('valor 3');
    });

    it('should translate thesauri values to french', async () => {
      const french = await getTranslation('fr', thesauriId);

      expect(Object.keys(french).length).toBe(5);

      expect(french.thesauri2Id).toBe('thesauri2Id');
      expect(french['existing value']).toBe('existing value');
      expect(french['value 1']).toBe('valeur 1');
      expect(french['value 2']).toBe('valeur 2');
      expect(french['value 3']).toBe('valeur 3');
    });

    it('should not duplicate existing values', async () => {
      const csv = `English, Spanish, French  ,
                   value1, valor1, valeur1,
                   value2, valor2, valeur2,
                   Value3, Valor3, Valeur3,
                   new value, nuevo valor, nouvelle valeur`;

      const mockedFile = mockCsvFileReadStream(csv);
      const updated = await loader.loadThesauri('mockedFileFromString', thesauri1Id, {
        language: 'en',
      });
      expect(updated!.values!.map(v => v.label)).toEqual([
        'value1',
        'value2',
        'Value3',
        ' value4 ',
        'new value',
      ]);
      mockedFile.mockRestore();
    });

    describe('nesting', () => {
      it('should allow nesting thesauri by prefixing the children', async () => {
        const { _id } = await thesauri.save({ name: 'nestedThesauri' });

        const csv = `English, Spanish, French
        value1, valor1, valeur1
        - value2, - valor2, - valeur2
        - value3, - valor3, - valeur3
        value4, valor4, valeur4`;

        const mockedFile = mockCsvFileReadStream(csv);
        const updated = await loader.loadThesauri('mockedFileFromString', _id, {
          language: 'en',
        });

        expect(updated).toMatchObject({
          name: 'nestedThesauri',
          values: [
            {
              label: 'value4',
            },
            {
              label: 'value1',
              values: [
                {
                  label: 'value2',
                },
                {
                  label: 'value3',
                },
              ],
            },
          ],
        });

        expect(await getTranslation('es', _id)).toMatchObject({
          nestedThesauri: 'nestedThesauri',
          value1: 'valor1',
          value2: 'valor2',
          value3: 'valor3',
          value4: 'valor4',
        });

        expect(await getTranslation('fr', _id)).toMatchObject({
          nestedThesauri: 'nestedThesauri',
          value1: 'valeur1',
          value2: 'valeur2',
          value3: 'valeur3',
          value4: 'valeur4',
        });

        mockedFile.mockRestore();
      });

      it('should allow updating an existing thesauri', async () => {
        const { _id } = await thesauri.save({
          name: 'existingNestedThesauri',
          values: [
            {
              label: 'value1',
              values: [
                {
                  label: 'value11',
                },
              ],
            },
            {
              label: 'value2',
            },
          ],
        });

        await translations.updateEntries(_id.toString(), {
          es: {
            value11: 'valor11',
            value2: 'valor2',
          },
          fr: {
            value11: 'valeur11',
            value2: 'valeur2',
          },
        });

        const csv = `English, Spanish, French
        value1, different translation for value1, valeur1
        - value12, - valor12, - valeur12
        value3, valor3, valeur3`;

        const mockedFile = mockCsvFileReadStream(csv);
        const updated = await loader.loadThesauri('mockedFileFromString', _id, {
          language: 'en',
        });

        expect(updated).toMatchObject({
          name: 'existingNestedThesauri',
          values: [
            {
              label: 'value1',
              values: [
                {
                  label: 'value11',
                },
                {
                  label: 'value12',
                },
              ],
            },
            {
              label: 'value2',
            },
            {
              label: 'value3',
            },
          ],
        });

        expect(await getTranslation('es', _id)).toMatchObject({
          existingNestedThesauri: 'existingNestedThesauri',
          value1: 'different translation for value1',
          value11: 'valor11',
          value12: 'valor12',
          value2: 'valor2',
          value3: 'valor3',
        });

        expect(await getTranslation('fr', _id)).toMatchObject({
          existingNestedThesauri: 'existingNestedThesauri',
          value1: 'valeur1',
          value11: 'valeur11',
          value12: 'valeur12',
          value2: 'valeur2',
          value3: 'valeur3',
        });
        mockedFile.mockRestore();
      });

      it('should throw error if csv has nesting inconsistencies across langs', async () => {
        const { _id } = await thesauri.save({ name: 'nestedThesauri2' });

        const csv = `English, Spanish, French
        value1, valor1, valeur1
        - value2, - valor2,  valeur2
        - value3, - valor3, - valeur3
        value4, valor4, valeur4`;

        const mockedFile = mockCsvFileReadStream(csv);
        try {
          await loader.loadThesauri('mockedFileFromString', _id, {
            language: 'en',
          });
          fail('should throw error');
        } catch (e) {
          expect(e.message.includes('Invalid')).toBe(true);
        }
        mockedFile.mockRestore();
      });

      it('should throw error if csv has nesting without parent', async () => {
        const { _id } = await thesauri.save({ name: 'nestedThesauri3' });

        const csv = `English, Spanish, French
        - value2, - valor2,  -valeur2`;

        const mockedFile = mockCsvFileReadStream(csv);
        try {
          await loader.loadThesauri('mockedFileFromString', _id, {
            language: 'en',
          });
          fail('should throw error');
        } catch (e) {
          expect(e.message.includes('Invalid')).toBe(true);
        }
        mockedFile.mockRestore();
      });
    });
  });
});
