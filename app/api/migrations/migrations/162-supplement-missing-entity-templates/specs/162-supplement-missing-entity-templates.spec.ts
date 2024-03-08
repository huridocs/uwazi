import { Db, ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Entity, Fixture, Template, TranslationDBO } from '../types';
import { fixtures, correctFixture, template1, template2, template3 } from './fixtures';

let db: Db | null;
let entityTemplatesInDB: (ObjectId | undefined)[] = [];
let newTemplate: Template | null;
let newTemplateId: ObjectId | null;
let translations: TranslationDBO[] = [];

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
  entityTemplatesInDB = (await db.collection<Entity>('entities').find({}).toArray()).map(
    e => e.template
  );
  newTemplate = await db!
    .collection<Template>('templates')
    .findOne({ name: '__recovered_entities__' });
  newTemplateId = newTemplate?._id || null;
  translations = await db.collection<TranslationDBO>('translationsV2').find({}).toArray();
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(162);
  });

  describe('on collections where no entity template is missing', () => {
    beforeAll(async () => {
      await initTest(correctFixture);
    });

    it('should not add the new template', async () => {
      expect(newTemplate).toBe(null);
    });

    it('should not change translations', async () => {
      expect(translations).toEqual(correctFixture.translationsV2);
    });

    it('should not change the entities', async () => {
      expect(entityTemplatesInDB).toEqual(correctFixture.entities.map(e => e.template));
    });

    it('should not signal reindex', () => {
      expect(migration.reindex).toBe(false);
    });
  });

  describe('on collections with missing entity templates', () => {
    beforeAll(async () => {
      await initTest(fixtures);
    });

    it('should add the new template', async () => {
      expect(newTemplate).toEqual({
        _id: newTemplateId,
        name: '__recovered_entities__',
        commonProperties: [
          {
            _id: expect.any(ObjectId),
            label: 'Title',
            name: 'title',
            isCommonProperty: true,
            type: 'text',
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            label: 'Date added',
            name: 'creationDate',
            isCommonProperty: true,
            type: 'date',
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            label: 'Date modified',
            name: 'editDate',
            isCommonProperty: true,
            type: 'date',
            prioritySorting: false,
          },
        ],
        properties: [],
        color: '#ff0000',
      });
    });

    it('should add the new template to the translations', async () => {
      const expectedContext = {
        type: 'Entity',
        label: '__recovered_entities__',
        id: newTemplateId!.toString(),
      };
      expect(translations).toEqual([
        ...fixtures.translationsV2,
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Title',
          value: 'Title',
          context: expectedContext,
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: '__recovered_entities__',
          value: '__recovered_entities__',
          context: expectedContext,
        },
        {
          _id: expect.any(ObjectId),
          language: 'es',
          key: 'Title',
          value: 'Title',
          context: expectedContext,
        },
        {
          _id: expect.any(ObjectId),
          language: 'es',
          key: '__recovered_entities__',
          value: '__recovered_entities__',
          context: expectedContext,
        },
      ]);
    });

    it('should add the new template to the missing entities', async () => {
      expect(entityTemplatesInDB).toEqual([
        template1,
        template2,
        newTemplateId,
        template2,
        newTemplateId,
        template3,
        newTemplateId,
        template1,
        template2,
        newTemplateId,
        template2,
        newTemplateId,
        template3,
        newTemplateId,
      ]);
    });

    it('should signal reindex', () => {
      expect(migration.reindex).toBe(true);
    });
  });
});
