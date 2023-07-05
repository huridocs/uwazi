/* eslint-disable max-lines */
import path from 'path';

import { CSVLoader } from 'api/csv';
import { templateWithGeneratedTitle } from 'api/csv/specs/csvLoaderFixtures';
import entities from 'api/entities';
import translations from 'api/i18n';
import { search } from 'api/search';
import settings from 'api/settings';
import db from 'api/utils/testing_db';
import typeParsers from '../typeParsers';
import fixtures, { template1Id } from './csvLoaderFixtures';
import { mockCsvFileReadStream } from './helpers';

describe('csvLoader', () => {
  const csvFile = path.join(__dirname, '/test.csv');
  const loader = new CSVLoader();

  beforeAll(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(entities, 'save').mockImplementation(async e => e);
  });

  afterAll(async () => db.disconnect());

  describe('user', () => {
    it('should use the passed user', async () => {
      await loader.load(csvFile, template1Id, { user: { username: 'user' }, language: 'en' });
      expect(entities.save.mock.calls[0][1].user).toEqual({ username: 'user' });
    });
  });

  describe('load translations', () => {
    let csv;
    let readStreamMock;
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);

      const nonExistent = 'Russian';

      csv = `Key       , English, Spanish, French  , ${nonExistent}  ,
                   original 1, value 1, valor 1, valeur 1, 1               ,
                   original 2, value 2, valor 2, valeur 2, 2               ,
                   original 3, value 3, valor 3, valeur 3, 3               ,`;
    });

    afterEach(() => {
      readStreamMock.mockRestore();
    });

    it('should set all translations from csv', async () => {
      readStreamMock = mockCsvFileReadStream(csv);
      await loader.loadTranslations('mockedFileFromString', 'System');
      const [english, spanish, french] = await translations.get();
      expect(english.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'value 1',
        'original 2': 'value 2',
        'original 3': 'value 3',
      });
      expect(spanish.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'valor 1',
        'original 2': 'valor 2',
        'original 3': 'valor 3',
      });
      expect(french.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'valeur 1',
        'original 2': 'valeur 2',
        'original 3': 'valeur 3',
      });
    });

    it('should not update a language that exists in the system but not in csv', async () => {
      readStreamMock = mockCsvFileReadStream(csv);
      await settings.addLanguage({ key: 'aa', label: 'Afar' });
      await translations.addLanguage('aa');
      await loader.loadTranslations('mockedFileFromString', 'System');
      const [afar] = await translations.get({ locale: 'aa' });
      expect(afar.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'original 1',
        'original 2': 'original 2',
        'original 3': 'original 3',
      });
    });

    it('should not remove translations that are not in the csv', async () => {
      const localCsv = `Key, English,
                        original 1, value 1`;
      readStreamMock = mockCsvFileReadStream(localCsv);
      await loader.loadTranslations('mockedFileFromString', 'System');

      const [english] = await translations.get();
      expect(english.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'value 1',
        'original 2': 'original 2',
        'original 3': 'original 3',
      });
    });
    it('should not import empty language translations', async () => {
      const localCsv = `Key, English, Spanish
                        original 1,, sp value 1`;
      readStreamMock = mockCsvFileReadStream(localCsv);
      await loader.loadTranslations('mockedFileFromString', 'System');

      const [english, spanish] = await translations.get();
      expect(english.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'original 1',
        'original 2': 'original 2',
        'original 3': 'original 3',
      });
      expect(spanish.contexts.find(c => c.id === 'System').values).toEqual({
        'original 1': 'sp value 1',
        'original 2': 'original 2',
        'original 3': 'original 3',
      });
    });
  });

  describe('load', () => {
    let imported;
    const events = [];

    beforeAll(async () => {
      jest.restoreAllMocks();
      await db.setupFixturesAndContext(fixtures);
      loader.on('entityLoaded', entity => {
        events.push(entity.title);
      });
      try {
        await loader.load(csvFile, template1Id, { language: 'en' });
      } catch (e) {
        throw loader.errors()[Object.keys(loader.errors())[0]];
      }

      imported = await entities.get({ language: 'en' });
    });

    it('should load title', () => {
      const textValues = imported.map(i => i.title);
      expect(textValues).toEqual(['title1', 'title2', 'title3']);
    });

    it('should generate an id when the template has a property with generatedid type', () => {
      expect(imported[0].metadata).toEqual(
        expect.objectContaining({
          auto_id: [{ value: expect.stringMatching(/^[a-zA-Z0-9-]{12}$/) }],
        })
      );
    });

    it('should emit event after each entity has been imported', () => {
      expect(events).toEqual(['title1', 'title2', 'title3']);
    });

    it('should only import valid metadata', () => {
      const metadataImported = Object.keys(imported[0].metadata);
      expect(metadataImported).toEqual([
        'text_label',
        'numeric_label',
        'select_label',
        'not_defined_type',
        'geolocation_geolocation',
        'auto_id',
        'additional_tag(s)',
        'multi_select_label',
        'date_label',
      ]);
    });

    it('should ignore properties not configured in the template', () => {
      const textValues = imported.map(i => i.metadata.non_configured).filter(i => i);

      expect(textValues.length).toEqual(0);
    });

    describe('metadata parsing', () => {
      it('should parse metadata properties by type using typeParsers', () => {
        const textValues = imported.map(i => i.metadata.text_label[0].value);
        expect(textValues).toEqual(['text value 1', 'text value 2', 'text value 3']);

        const numericValues = imported.map(i => i.metadata.numeric_label[0].value);
        expect(numericValues).toEqual([1977, 2019, 2020]);

        const thesauriValues = imported.map(i => i.metadata.select_label[0].label);
        expect(thesauriValues).toEqual(['thesauri1', 'thesauri2', 'thesauri2']);

        const dateValues = imported.map(i => i.metadata.date_label[0].value);
        expect(dateValues).toEqual([1641168000, 1646092800, 1640995200]);
      });

      it('should import properties that contains parentheses in the name', () => {
        const additionalTags = imported.map(i => i.metadata['additional_tag(s)'][0].value);
        expect(additionalTags).toEqual(['tag1', 'tag2', 'tag3']);
      });

      describe('when parser not defined', () => {
        it('should use default parser', () => {
          const noTypeValues = imported.map(i => i.metadata.not_defined_type[0].value);
          expect(noTypeValues).toEqual(['notType1', 'notType2', 'notType3']);
        });
      });
    });
  });

  describe('on error', () => {
    it('should stop processing on the first error', async () => {
      const testingLoader = new CSVLoader();

      await db.setupFixturesAndContext(fixtures);
      jest.spyOn(entities, 'save').mockImplementation(entity => {
        throw new Error(`error-${entity.title}`);
      });

      try {
        await testingLoader.load(csvFile, template1Id);
        throw new Error('should fail');
      } catch (e) {
        expect(e).toEqual(new Error('error-title1'));
      }
    });
    it('should throw the error that occurred even if it was not the first row', async () => {
      const testingLoader = new CSVLoader();

      await db.setupFixturesAndContext(fixtures);
      jest
        .spyOn(entities, 'save')
        .mockImplementationOnce(({ title }) => Promise.resolve({ title }))
        .mockImplementationOnce(({ title }) => Promise.reject(new Error(`error-${title}`)));

      try {
        await testingLoader.load(csvFile, template1Id);
        throw new Error('should fail');
      } catch (e) {
        expect(e).toEqual(new Error('error-title2'));
      }
    });
  });

  describe('no stop on errors', () => {
    beforeEach(async () => {
      jest.spyOn(entities, 'save').mockImplementation(entity => {
        if (entity.title === 'title1' || entity.title === 'title3') {
          throw new Error(`error-${entity.title}`);
        }
        return entity;
      });
      await db.setupFixturesAndContext(fixtures);
    });

    it('should emit an error', async () => {
      const testingLoader = new CSVLoader({ stopOnError: false });

      const eventErrors = {};
      testingLoader.on('loadError', (error, entity) => {
        eventErrors[entity.title] = error;
      });

      try {
        await testingLoader.load(csvFile, template1Id);
      } catch (e) {
        expect(eventErrors).toEqual({
          title1: new Error('error-title1'),
          title3: new Error('error-title3'),
        });
      }
    });

    it('should save errors and index them by csv line, should throw an error on finish', async () => {
      const testingLoader = new CSVLoader({ stopOnError: false });

      try {
        await testingLoader.load(csvFile, template1Id);
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).toMatch(/multiple errors/i);
        expect(testingLoader.errors()).toEqual({
          0: new Error('error-title1'),
          2: new Error('error-title3'),
        });
      }
    });

    it('should fail when parsing throws an error', async () => {
      jest.spyOn(entities, 'save').mockImplementation(() => Promise.resolve({}));
      jest.spyOn(typeParsers, 'text').mockImplementation(entity => {
        if (entity.title === 'title2') {
          throw new Error(`error-${entity.title}`);
        }
      });

      const testingLoader = new CSVLoader({ stopOnError: false });

      try {
        await testingLoader.load(csvFile, template1Id);
        throw new Error('should fail');
      } catch (e) {
        expect(testingLoader.errors()).toEqual({
          1: new Error('error-title2'),
        });
      }
    });
  });

  describe('when sharedId is provided', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      await db.setupFixturesAndContext(fixtures);
    });

    it('should update the entity', async () => {
      const entity = await entities.save(
        { title: 'entity4444', template: template1Id },
        { user: {}, language: 'en' }
      );
      const csv = `id                , title    ,
                   ${entity.sharedId}, new title,
                                     , title2   ,`;
      const readStreamMock = mockCsvFileReadStream(csv);
      const testingLoader = new CSVLoader();
      await testingLoader.load('mockedFileFromString', template1Id, { language: 'en' });

      const [expected] = await entities.get({
        sharedId: entity.sharedId,
        language: 'en',
      });
      expect(expected.title).toBe('new title');
      readStreamMock.mockRestore();
    });
  });

  describe('when the title is not provided', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      await db.setupFixturesAndContext(fixtures);
    });

    describe('title not marked with generated Id option', () => {
      it('should throw a validation error', async () => {
        const csv = `title , numeric label
                       , 10
                 title2, 10`;
        mockCsvFileReadStream(csv);
        const testingLoader = new CSVLoader();

        try {
          await testingLoader.load('mockedFileFromString', template1Id, { language: 'en' });
        } catch (e) {
          expect(e.message).toEqual('validation failed');
          expect(e.errors[0].instancePath).toEqual('/title');
        }
      });
    });

    describe('title marked with generated Id option', () => {
      it('should set a generatedId as the title if a value is not provided', async () => {
        const csv = `title , numeric label
                       , 10
                 title2, 10`;
        mockCsvFileReadStream(csv);
        const testingLoader = new CSVLoader();

        await testingLoader.load('mockedFileFromString', templateWithGeneratedTitle, {
          language: 'en',
        });
        const result = await entities.get({
          'metadata.numeric_label.value': 10,
          language: 'en',
        });
        expect(result[0].title).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
        expect(result[1].title).toBe('title2');
      });

      it('should set a generatedId as the title if column is not provided', async () => {
        const csv = `numeric label
                     20
                     22`;
        mockCsvFileReadStream(csv);
        const testingLoader = new CSVLoader();
        await testingLoader.load('mockedFileFromString', templateWithGeneratedTitle, {
          language: 'en',
        });
        const result = await entities.get({
          'metadata.numeric_label.value': { $in: [20, 22] },
          language: 'en',
        });
        expect(result[0].title).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
        expect(result[1].title).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
        expect(result[0].title !== result[1].title);
      });
    });
  });
});
