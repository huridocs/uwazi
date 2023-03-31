import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import { TranslationValue } from 'shared/translationType';
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

  const createTranslation = async () =>
    translations.save({
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

  const updateTranslation = async (_id: ObjectId, values: TranslationValue[]) =>
    translations.save({
      _id,
      locale: 'en',
      contexts: [
        {
          id: 'contextId',
          label: 'contextLabel',
          type: 'Entity',
          values,
        },
      ],
    });

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
          language: 'en',
          key: 'Key',
          value: 'Value',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          language: 'en',
          key: 'Key2',
          value: 'Value2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
      ]);
    });

    describe('when updating (the translation object has an _id)', () => {
      it('should do nothing when the feature flag is off', async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });

        const savedTranslations = await createTranslation();
        await updateTranslation(savedTranslations._id, [{ key: 'Key', value: 'updatedValue' }]);

        const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();
        expect(createdTranslations).toEqual([]);
      });

      it('should update already existing translations and create new ones', async () => {
        const savedTranslations = await createTranslation();
        await updateTranslation(savedTranslations._id, [
          { key: 'Key', value: 'updatedValue' },
          { key: 'Key2', value: 'updatedValue2' },
          { key: 'Key3', value: 'createdValue' },
        ]);

        const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();

        expect(createdTranslations).toMatchObject([
          {
            language: 'en',
            key: 'Key',
            value: 'updatedValue',
            context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
          },
          {
            language: 'en',
            key: 'Key2',
            value: 'updatedValue2',
            context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
          },
          {
            language: 'en',
            key: 'Key3',
            value: 'createdValue',
            context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
          },
        ]);
      });
    });
  });

  describe('deleteContext', () => {
    it('should delete all translations belonging to a context', async () => {
      await translations.save({
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
          {
            id: 'contextId2',
            label: 'contextLabel',
            type: 'Entity',
            values: [
              { key: 'Key', value: 'Value' },
              { key: 'Key2', value: 'Value2' },
            ],
          },
        ],
      });

      await translations.deleteContext('contextId');
      const translationsRemaining = await db.collection(newTranslationsCollection).find().toArray();
      expect(translationsRemaining).toMatchObject([
        {
          language: 'en',
          key: 'Key',
          value: 'Value',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId2' },
        },
        {
          language: 'en',
          key: 'Key2',
          value: 'Value2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId2' },
        },
      ]);
    });
  });

  describe('removeLanguage', () => {
    it('should delete all translations belonging to a language', async () => {
      await translations.save({
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

      await translations.save({
        locale: 'es',
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

      await translations.removeLanguage('en');
      const translationsRemaining = await db.collection(newTranslationsCollection).find().toArray();
      expect(translationsRemaining).toMatchObject([
        {
          language: 'es',
          key: 'Key',
          value: 'Value',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          language: 'es',
          key: 'Key2',
          value: 'Value2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
      ]);
    });
  });
});
