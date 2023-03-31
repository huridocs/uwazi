import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import translations from '../translations';

import fixtures from './fixtures.js';

let db: Db;
const newTranslationsCollection = 'translations_v2';

describe('translations v2 support', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb as Db;
    testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: true } });
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const createTranslation = async () => {
    return translations.save({
      locale: 'en',
      contexts: [
        {
          id: 'contextId',
          label: 'contextLabel',
          type: 'Entity',
          values: [
            { key: 'Key', value: 'Value' },
            { key: 'Key2', value: 'Value2' },
          ],
        },
      ],
    });
  };

  describe('save', () => {
    it('should do nothing when the feature flag is off', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });
      await createTranslation();

      const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();
      expect(createdTranslations).toEqual([]);
    });

    it('should save the translations to the new translations collection', async () => {
      await createTranslation();

      const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();

      expect(createdTranslations).toMatchObject([
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Key',
          value: 'Value',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Key2',
          value: 'Value2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
      ]);
    });

    it('should update already existing translations and create new ones', async () => {
      const savedTranslations = await createTranslation();
      await translations.save({
        _id: savedTranslations._id,
        locale: 'en',
        contexts: [
          {
            id: 'contextId',
            label: 'contextLabel',
            type: 'Entity',
            values: [
              { key: 'Key', value: 'updatedValue' },
              { key: 'Key2', value: 'updatedValue2' },
              { key: 'Key3', value: 'createdValue' },
            ],
          },
        ],
      });

      const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();

      expect(createdTranslations).toMatchObject([
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Key',
          value: 'updatedValue',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Key2',
          value: 'updatedValue2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          _id: expect.any(ObjectId),
          language: 'en',
          key: 'Key3',
          value: 'createdValue',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
      ]);
    });
  });
});
