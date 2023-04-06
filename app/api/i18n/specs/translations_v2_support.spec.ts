import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import { TranslationValue } from 'shared/translationType';
import translations from '../translations';
import translationsModel from '../translationsModel';

import fixtures from './fixtures.js';

let db: Db;
const newTranslationsCollection = 'translations_v2';

describe('translations v2 support', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext({ ...fixtures, translations: [] });
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

  describe('addLanguage', () => {
    it('should do nothing when the feature flag is off', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });
      await createTranslation();
      await translations.addLanguage('ca');

      const createdTranslations = await db
        .collection(newTranslationsCollection)
        .find({ language: 'ca' })
        .toArray();

      expect(createdTranslations).toEqual([]);
    });

    it('should duplicate translations from the default language to the new one', async () => {
      await createTranslation();

      await translations.addLanguage('ca');

      const createdTranslations = await db
        .collection(newTranslationsCollection)
        .find({ language: 'ca' })
        .toArray();

      expect(createdTranslations).toMatchObject([
        {
          language: 'ca',
          key: 'Key',
          value: 'Value',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
        {
          language: 'ca',
          key: 'Key2',
          value: 'Value2',
          context: { type: 'Entity', label: 'contextLabel', id: 'contextId' },
        },
      ]);
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

  describe('get', () => {
    describe('when feature flag is off', () => {
      it('should not migrate translations to new collection', async () => {
        await testingDB.setupFixturesAndContext(fixtures);
        testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });

        await translations.get();

        const translationsMigrated = await db
          .collection(newTranslationsCollection)
          .find()
          .toArray();

        expect(translationsMigrated).toMatchObject([]);
      });
      it('should empty the new translations collection', async () => {
        await testingDB.setupFixturesAndContext(fixtures);

        await translations.get();
        testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });
        await translations.get();

        const translationsMigrated = await db
          .collection(newTranslationsCollection)
          .find()
          .toArray();

        expect(translationsMigrated).toMatchObject([]);
      });
    });
    describe('when feature flag is on', () => {
      it('should migrate current translations to the new collection', async () => {
        await testingDB.setupFixturesAndContext(fixtures);

        await translations.get();

        const translationsMigrated = await db
          .collection(newTranslationsCollection)
          .find({ 'context.id': 'System', language: 'en' })
          .toArray();

        expect(translationsMigrated).toMatchObject([
          {
            language: 'en',
            key: 'Password',
            value: 'Password',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Account',
            value: 'Account',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Email',
            value: 'E-Mail',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Age',
            value: 'Age',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Library',
            value: 'Library',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
        ]);
      });

      it('should only migrate once (on concurrent calls also)', async () => {
        await testingDB.setupFixturesAndContext(fixtures);

        await Promise.all([translations.get(), translations.get(), translations.get()]);

        const numberOfTranslationsMigrated = await db
          .collection(newTranslationsCollection)
          .countDocuments();

        expect(numberOfTranslationsMigrated).toBe(18);
      });

      it('should return from the old collection when not migrated', async () => {
        await testingDB.setupFixturesAndContext({
          ...fixtures,
          translations: [
            {
              locale: 'en',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Password' },
                    { key: 'Account', value: 'Account' },
                  ],
                },
              ],
            },
          ],
        });
        const [english] = await translations.get();
        expect(english).toMatchObject({
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: {
                Account: 'Account',
                Password: 'Password',
              },
            },
          ],
        });
      });

      it('should return from the new collection when migrated', async () => {
        await testingDB.setupFixturesAndContext({
          ...fixtures,
          translations: [
            {
              locale: 'es',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Contraseña' },
                    { key: 'Account', value: 'Cuenta' },
                  ],
                },
              ],
            },
            {
              locale: 'en',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Password' },
                    { key: 'Account', value: 'Account' },
                  ],
                },
              ],
            },
          ],
        });
        await translations.get();
        jest.spyOn(translationsModel, 'get').mockReturnValue(Promise.resolve([]));
        const [spanish, english] = await translations.get();
        expect(english).toMatchObject({
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: [
                { key: 'Password', value: 'Password' },
                { key: 'Account', value: 'Account' },
              ],
            },
          ],
        });

        expect(spanish).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: [
                { key: 'Password', value: 'Contraseña' },
                { key: 'Account', value: 'Cuenta' },
              ],
            },
          ],
        });
      });

      it('should return only the language requested', async () => {
        await testingDB.setupFixturesAndContext({
          ...fixtures,
          translations: [
            {
              locale: 'es',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Contraseña' },
                    { key: 'Account', value: 'Cuenta' },
                  ],
                },
              ],
            },
            {
              locale: 'en',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Password' },
                    { key: 'Account', value: 'Account' },
                  ],
                },
              ],
            },
          ],
        });
        await translations.get();
        jest.spyOn(translationsModel, 'get').mockReturnValue(Promise.resolve([]));
        const [spanish, english] = await translations.get({ locale: 'es' });
        expect(english).toBeUndefined();
        expect(spanish).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: [
                { key: 'Password', value: 'Contraseña' },
                { key: 'Account', value: 'Cuenta' },
              ],
            },
          ],
        });
      });

      it('should return only the old _id requested which maps to a language', async () => {
        const englishId = new ObjectId();
        await testingDB.setupFixturesAndContext({
          ...fixtures,
          translations: [
            {
              _id: englishId,
              locale: 'es',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Contraseña' },
                    { key: 'Account', value: 'Cuenta' },
                  ],
                },
              ],
            },
            {
              locale: 'en',
              contexts: [
                {
                  id: 'System',
                  label: 'System',
                  type: 'Uwazi UI',
                  values: [
                    { key: 'Password', value: 'Password' },
                    { key: 'Account', value: 'Account' },
                  ],
                },
              ],
            },
          ],
        });
        await translations.get();
        jest.spyOn(translationsModel, 'get').mockReturnValue(Promise.resolve([]));
        const [english, rest] = await translations.get({ _id: englishId.toString() });
        expect(rest).toBeUndefined();
        expect(english).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: [
                { key: 'Password', value: 'Password' },
                { key: 'Account', value: 'Account' },
              ],
            },
          ],
        });
      });
    });
  });
});
