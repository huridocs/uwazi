import db from 'api/utils/testing_db';
import entities from 'api/entities';
import path from 'path';
import translations from 'api/i18n';
import { search } from 'api/search';

import CSVLoader from '../csvLoader';
import fixtures, { template1Id } from './fixtures';
import { stream } from './helpers';
import typeParsers from '../typeParsers';

describe('csvLoader', () => {
  const csvFile = path.join(__dirname, '/test.csv');
  const loader = new CSVLoader();

  typeParsers.select = () => Promise.resolve('thesauri');
  typeParsers.text = () => Promise.resolve('text');
  typeParsers.default = () => Promise.resolve('default');

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    spyOn(translations, 'updateContext').and.returnValue(Promise.resolve());
  });

  afterAll(async () => db.disconnect());

  it('should use the passed user', async () => {
    spyOn(entities, 'save').and.returnValue(Promise.resolve({}));
    await loader.load(csvFile, template1Id, { user: { username: 'user' }, language: 'en' });
    expect(entities.save.calls.argsFor(0)[1].user).toEqual({ username: 'user' });
  });

  describe('load', () => {
    let imported;
    const events = [];

    beforeAll(async () => {
      loader.on('entityLoaded', (entity) => {
        events.push(entity.title);
      });

      try {
        await loader.load(csvFile, template1Id, { language: 'en' });
      } catch (e) {
        throw loader.errors()[Object.keys(loader.errors())[0]];
      }

      imported = await entities.get();
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
        'not_defined_type'
      ]);
    });

    it('should ignore properties not configured in the template', () => {
      const textValues = imported
      .map(i => i.metadata.non_configured)
      .filter(i => i);

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
      const testingLoader = new CSVLoader();

      await db.clearAllAndLoad(fixtures);
      spyOn(entities, 'save').and.callFake(entity => Promise.reject(new Error(`error-${entity.title}`)));

      try {
        await testingLoader.load(csvFile, template1Id);
        fail('should fail');
      } catch (e) {
        expect(e).toEqual(new Error('error-title1'));
      }
    });
    it('should throw the error that occurred even if it was not the first row', async () => {
      const testingLoader = new CSVLoader();

      await db.clearAllAndLoad(fixtures);
      jest.spyOn(entities, 'save')
      .mockImplementationOnce(({ title }) => Promise.resolve(({ title })))
      .mockImplementationOnce(({ title }) => Promise.reject(new Error(`error-${title}`)));

      try {
        await testingLoader.load(csvFile, template1Id);
        fail('should fail');
      } catch (e) {
        expect(e).toEqual(new Error('error-title2'));
      }
    });
  });

  describe('no stop on errors', () => {
    beforeAll(async () => {
      spyOn(entities, 'save').and.callFake((entity) => {
        if (entity.title === 'title1' || entity.title === 'title3') {
          return Promise.reject(new Error(`error-${entity.title}`));
        }
        return Promise.resolve({});
      });
      await db.clearAllAndLoad(fixtures);
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
        fail('should fail');
      } catch (e) {
        expect(e.message).toMatch(/multiple errors/i);
        expect(testingLoader.errors()).toEqual({
          0: new Error('error-title1'),
          2: new Error('error-title3'),
        });
      }
    });

    it('should fail when parsing throws an error', async () => {
      entities.save.and.callFake(() => Promise.resolve({}));
      spyOn(typeParsers, 'text').and.callFake((entity) => {
        if (entity.title === 'title2') {
          return Promise.reject(new Error(`error-${entity.title}`));
        }
        return Promise.resolve({});
      });

      const testingLoader = new CSVLoader({ stopOnError: false });

      try {
        await testingLoader.load(csvFile, template1Id);
        fail('should fail');
      } catch (e) {
        expect(testingLoader.errors()).toEqual({
          1: new Error('error-title2'),
        });
      }
    });
  });

  describe('when sharedId is provided', () => {
    it('should update the entitiy', async () => {
      const entity = await entities.save(
        { title: 'entity', template: template1Id },
        { user: {}, language: 'en' }
      );
      const csv = `id                , title    ,
                   ${entity.sharedId}, new title,
                                     , title2   ,`;

      const testingLoader = new CSVLoader();
      await testingLoader.load(stream(csv), template1Id, { language: 'en' });

      const [expected] = await entities.get({
        sharedId: entity.sharedId,
        language: 'en'
      });
      expect(expected.title).toBe('new title');
    });
  });
});
