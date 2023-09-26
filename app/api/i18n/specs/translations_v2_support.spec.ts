import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db } from 'mongodb';

import translations from '../translations';
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
    db = testingDB.mongodb as Db;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('updateContext', () => {
    describe('when feature flag is on', () => {
      it('should change the value of a translation when changing the key if the locale is the default one', async () => {
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

      it('should properly change context name, key names, values for the keys changed and deleteProperties, and create new values as new translations if key does not exists', async () => {
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
});
