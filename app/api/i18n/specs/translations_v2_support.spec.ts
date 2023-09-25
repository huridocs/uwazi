import settings from 'api/settings';
import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import { TranslationValue } from 'shared/translationType';
import { ContextType } from 'shared/translationSchema';

import translations from '../translations';
import { migrateTranslationsToV2 } from '../v2_support';
import fixtures, { dictionaryId } from './fixtures';

let db: Db;
const newTranslationsCollection = 'translationsV2';

describe('translations v2 support', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
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
    fit('should save the translations to the new translations collection', async () => {
      await testingDB.setupFixturesAndContext({
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      });

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
      fit('should update already existing translations and create new ones', async () => {
        const enTranslationId = testingDB.id();
        await testingDB.setupFixturesAndContext({
          settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
        });

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
    fit('should duplicate translations from the default language to the new one', async () => {
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
    fit('should delete all translations belonging to a context', async () => {
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
    fit('should delete all translations belonging to a language', async () => {
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
    describe('when feature flag is on', () => {
      fit('should return from the new collection when migrated', async () => {
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
        await migrateTranslationsToV2();
        const [spanish, english] = await translations.get();

        const englishComesFromTheOldCollection = english._id;
        expect(englishComesFromTheOldCollection).toBeFalsy();

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

        const spanishComesFromTheOldCollection = spanish._id;
        expect(spanishComesFromTheOldCollection).toBeFalsy();

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

      fit('should return only the language requested', async () => {
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
        await migrateTranslationsToV2();
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

      fit('should return only the language and context requested', async () => {
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
      fit('should change the value of a translation when changing the key if the locale is the default one', async () => {
        await testingDB.setupFixturesAndContext(fixtures);

        const values = {};

        await translations.updateContext(
          { id: dictionaryId.toString(), label: 'new context name', type: 'Thesaurus' },
          { 'property should only change value on default languge': 'new property name' },
          [],
          values
        );

        const [propertyES] = await db
          .collection(newTranslationsCollection)
          .find({ key: 'new property name', language: 'es' })
          .toArray();

        const [propertyEN] = await db
          .collection(newTranslationsCollection)
          .find({ key: 'new property name', language: 'en' })
          .toArray();

        const [propertyZH] = await db
          .collection(newTranslationsCollection)
          .find({ key: 'new property name', language: 'zh' })
          .toArray();

        expect(propertyES.value).toBe('property');
        expect(propertyZH.value).toBe('property');
        expect(propertyEN.value).toBe('new property name');
      });

      fit('should properly change context name, key names, values for the keys changed and deleteProperties, and create new values as new translations if key does not exists', async () => {
        //changed keys should change value also when the locale is the default one
        //! use the previous commit to remove the update and then implement the key change functionality
        await testingDB.setupFixturesAndContext(fixtures);

        const values = {
          'new key': 'new value',
          'property should only change value on default languge': 'new value',
        };

        await translations.updateContext(
          { id: dictionaryId.toString(), label: 'new context name', type: 'Thesaurus' },
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
            value: 'New Account Key',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'New Password key',
            value: 'New Password key',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'dictionary 2',
            value: 'dictionary 2',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'new key',
            value: 'new value',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'en',
            key: 'property should only change value on default languge',
            value: 'property',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
        ]);

        expect(updatedTranslations.filter(t => t.language === 'es')).toMatchObject([
          {
            language: 'es',
            key: 'New Account Key',
            value: 'Cuenta',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'New Password key',
            value: 'Contraseña',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'dictionary 2',
            value: 'dictionary 2',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'new key',
            value: 'new value',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
          {
            language: 'es',
            key: 'property should only change value on default languge',
            value: 'property',
            context: { type: 'Thesaurus', label: 'new context name', id: dictionaryId.toString() },
          },
        ]);
      });
    });
  });

  describe('addContext()', () => {
    fit('should add a context with its values', async () => {
      await testingDB.setupFixturesAndContext(fixtures);

      const values = { Name: 'Name', Surname: 'Surname' };
      const result = await translations.addContext('context', 'Judge', values, ContextType.entity);

      expect(result).toBe('ok');

      const newContextTranslations = await db
        .collection(newTranslationsCollection)
        .find({ language: { $in: ['es', 'en'] }, 'context.id': 'context' })
        .sort({ language: 1, key: 1 })
        .toArray();

      expect(newContextTranslations.filter(t => t.language === 'es')).toMatchObject([
        {
          language: 'es',
          key: 'Name',
          value: 'Name',
          context: { type: ContextType.entity, label: 'Judge', id: 'context' },
        },
        {
          language: 'es',
          key: 'Surname',
          value: 'Surname',
          context: { type: ContextType.entity, label: 'Judge', id: 'context' },
        },
      ]);

      expect(newContextTranslations.filter(t => t.language === 'en')).toMatchObject([
        {
          language: 'en',
          key: 'Name',
          value: 'Name',
          context: { type: ContextType.entity, label: 'Judge', id: 'context' },
        },
        {
          language: 'en',
          key: 'Surname',
          value: 'Surname',
          context: { type: ContextType.entity, label: 'Judge', id: 'context' },
        },
      ]);
    });
  });
});
