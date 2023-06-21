import settings from 'api/settings';
import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import { TranslationValue } from 'shared/translationType';
import translations from '../translations';
import { migrateTranslationsToV2 } from '../v2_support';
import migration from '../../i18n.v2/migrations';

import fixtures, { dictionaryId } from './fixtures';

let db: Db;
const newTranslationsCollection = 'translations_v2';

describe('translations v2 support', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext({
      ...fixtures,
      translations: [
        {
          locale: 'es',
          contexts: [
            {
              id: 'contextId',
              label: 'contextLabel',
              type: 'Entity',
              values: [
                { key: 'Key', value: 'Value' },
                { key: 'Key2', value: 'Value2' },
                { key: 'Key3', value: 'Value3' },
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
        },
        {
          locale: 'zh',
          contexts: [
            {
              id: 'contextId',
              label: 'contextLabel',
              type: 'Entity',
              values: [
                { key: 'Key', value: 'Value' },
                { key: 'Key2', value: 'Value2' },
                { key: 'Key3', value: 'Value3' },
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
        },
      ],
    });
    testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: true } });
    await migrateTranslationsToV2();
    db = testingDB.mongodb as Db;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const deactivateFeature = async () => {
    await testingDB.setupFixturesAndContext({ ...fixtures, translations: [] });
    testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });
    await migrateTranslationsToV2();
  };

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
    it('should do nothing when the feature flag is off (Temporary test)', async () => {
      await deactivateFeature();

      await createTranslation();

      const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();
      expect(createdTranslations).toEqual([]);
    });

    it('should use locale to update the old translations collection (Temporary test)', async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: false } });
      await createTranslation();
      await createTranslation();
      const oldTranslations = await db.collection('translations').find().toArray();
      expect(oldTranslations.map(t => t.locale)).toEqual(['es', 'zh', 'en']);
    });

    it('should save the translations to the new translations collection', async () => {
      await testingDB.setupFixturesAndContext({
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
        translations: [],
      });
      await migrateTranslationsToV2();
      await createTranslation();

      const createdTranslations = await db
        .collection(newTranslationsCollection)
        .find({ language: 'en' })
        .toArray();

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

    describe('when updating (the translation already exists on db)', () => {
      it('should not save anything on the new collection', async () => {
        await deactivateFeature();

        const savedTranslations = await createTranslation();
        await updateTranslation(savedTranslations._id, [{ key: 'Key', value: 'updatedValue' }]);

        const createdTranslations = await db.collection(newTranslationsCollection).find().toArray();
        expect(createdTranslations).toEqual([]);
      });

      it('should update already existing translations and create new ones', async () => {
        const enTranslationId = testingDB.id();
        await testingDB.setupFixturesAndContext({
          settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
          translations: [
            {
              _id: enTranslationId,
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
            },
          ],
        });
        await migrateTranslationsToV2();
        await updateTranslation(enTranslationId, [
          { key: 'Key', value: 'updatedValue' },
          { key: 'Key2', value: 'updatedValue2' },
          { key: 'Key3', value: 'createdValue' },
        ]);

        const createdTranslations = await db
          .collection(newTranslationsCollection)
          .find({ language: 'en' })
          .toArray();

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
    it('should not create new ones on the new collection', async () => {
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
      await testingDB.setupFixturesAndContext({
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
        translations: [
          {
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
          },
        ],
      });
      await migrateTranslationsToV2();

      await settings.addLanguage({ label: 'catalan', key: 'ca' });
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
      const translationsRemaining = await db
        .collection(newTranslationsCollection)
        .find({ language: 'en' })
        .toArray();
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
      await createTranslation();

      await translations.removeLanguage('en');

      const enTranslations = (
        await db.collection(newTranslationsCollection).find({ language: 'en' }).toArray()
      ).length;
      expect(enTranslations).toBe(0);

      const esTranslations = (
        await db.collection(newTranslationsCollection).find({ language: 'es' }).toArray()
      ).length;
      expect(esTranslations).toBe(5);
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
          .sort({ key: 1 })
          .toArray();

        expect(translationsMigrated).toMatchObject([
          {
            language: 'en',
            key: 'Account',
            value: 'Account',
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
            key: 'Email',
            value: 'E-Mail',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Library',
            value: 'Library',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
          {
            language: 'en',
            key: 'Password',
            value: 'Password',
            context: { type: 'Uwazi UI', label: 'System', id: 'System' },
          },
        ]);
      });

      it('should only migrate once (on concurrent calls also)', async () => {
        await testingDB.setupFixturesAndContext(fixtures);

        jest.spyOn(migration, 'up');
        await Promise.all([translations.get(), translations.get(), translations.get()]);
        expect(migration.up).toHaveBeenCalledTimes(1);
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
        const [spanish, english] = await translations.get();

        const englishComesFromTheOldCollection = !english._id;
        expect(englishComesFromTheOldCollection).toBe(true);

        expect(english).toMatchObject({
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: { Password: 'Password', Account: 'Account' },
            },
          ],
        });

        const spanishComesFromTheOldCollection = !spanish._id;
        expect(spanishComesFromTheOldCollection).toBe(true);

        expect(spanish).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: { Password: 'Contraseña', Account: 'Cuenta' },
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
        const [spanish, english] = await translations.get({ locale: 'es' });
        expect(english).toBeUndefined();
        expect(spanish).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: { Password: 'Contraseña', Account: 'Cuenta' },
            },
          ],
        });
      });

      it('should return only the language and context requested', async () => {
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
                {
                  id: 'context 2',
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
        const [spanish] = await translations.get({ context: 'System' });
        expect(spanish).toMatchObject({
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              type: 'Uwazi UI',
              values: { Password: 'Contraseña', Account: 'Cuenta' },
            },
          ],
        });
      });
    });
  });

  describe('updateContext', () => {
    describe('when feature flag is on', () => {
      it('should properly change context name, key names, values for the keys changed and deleteProperties, and create new values as new translations', async () => {
        testingTenants.changeCurrentTenant({ featureFlags: { translationsV2: true } });
        await testingDB.setupFixturesAndContext(fixtures);
        await translations.get();

        const values = {
          'New Account Key': 'Account edited',
          'new key': 'new value',
        };

        await translations.updateContext(
          dictionaryId.toString(),
          'new context name',
          { Account: 'New Account Key', Password: 'New Password key' },
          ['Email', 'Age'],
          values
        );

        const updatedTranslations = await db
          .collection(newTranslationsCollection)
          .find({ language: { $in: ['es', 'en'] }, 'context.id': dictionaryId.toString() })
          .sort({ language: 1, key: 1 })
          .toArray();

        expect(updatedTranslations.filter(t => t.language === 'en')).toMatchObject([
          {
            language: 'en',
            key: 'New Account Key',
            value: 'Account edited',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'New Password key',
            value: 'Password',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'dictionary 2',
            value: 'dictionary 2',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'new key',
            value: 'new value',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
        ]);

        expect(updatedTranslations.filter(t => t.language === 'es')).toMatchObject([
          {
            language: 'es',
            key: 'New Account Key',
            value: 'Cuenta',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'New Password key',
            value: 'Contraseña',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'dictionary 2',
            value: 'dictionary 2',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'new key',
            value: 'new value',
            context: { type: 'Dictionary', label: 'new context name', id: dictionaryId.toString() },
          },
        ]);
      });
    });
  });
});
