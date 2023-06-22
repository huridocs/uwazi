import settings from 'api/settings';
import { testingTenants } from 'api/utils/testingTenants';
import testingDB from 'api/utils/testing_db';
import { Db } from 'mongodb';
import { ContextType } from 'shared/translationSchema';
import { TranslationValue } from 'shared/translationType';
import translations from '../translations';
import fixtures, { dictionaryId } from './fixtures';

let db: Db;
const newTranslationsCollection = 'translations_v2';

describe('translations v2 support', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext({
      ...fixtures,
      translations_v2: [
        {
          language: 'es',
          key: 'Key2',
          value: 'Value2',
          context: { id: 'contextId2', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'es',
          key: 'Key',
          value: 'Value',
          context: { id: 'contextId2', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'es',
          key: 'Key3',
          value: 'Value3',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'es',
          key: 'Key2',
          value: 'Value2',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'es',
          key: 'Key',
          value: 'Value',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },

        {
          language: 'zh',
          key: 'Key2',
          value: 'Value2',
          context: { id: 'contextId2', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'zh',
          key: 'Key',
          value: 'Value',
          context: { id: 'contextId2', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'zh',
          key: 'Key3',
          value: 'Value3',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'zh',
          key: 'Key2',
          value: 'Value2',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },
        {
          language: 'zh',
          key: 'Key',
          value: 'Value',
          context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
        },
      ],
    });
    db = testingDB.mongodb as Db;
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

  const updateTranslation = async (language: string, values: TranslationValue[]) =>
    translations.save({
      locale: language,
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
    it('should save the translations to the new translations collection', async () => {
      await testingDB.setupFixturesAndContext({
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
        translations: [],
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
      it('should update already existing translations and create new ones', async () => {
        await updateTranslation('en', [
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
    it('should duplicate translations from the default language to the new one', async () => {
      await testingDB.setupFixturesAndContext({
        settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
        translations_v2: [
          {
            language: 'en',
            key: 'Key',
            value: 'Value',
            context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
          },
          {
            language: 'en',
            key: 'Key2',
            value: 'Value2',
            context: { id: 'contextId', label: 'contextLabel', type: 'Entity' },
          },
        ],
      });

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
    it('should return only the language requested', async () => {
      const [spanish, english] = await translations.get({ locale: 'es' });
      expect(english).toBeUndefined();
      expect(spanish).toMatchObject({ locale: 'es' });
    });

    it('should return only the context requested', async () => {
      await testingDB.setupFixturesAndContext({
        ...fixtures,
        translations_v2: [
          {
            language: 'en',
            key: 'Account',
            value: 'Account',
            context: { id: 'System', label: 'System', type: 'Uwazi UI' },
          },
          {
            language: 'en',
            key: 'Password',
            value: 'Password',
            context: { id: 'System', label: 'System', type: 'Uwazi UI' },
          },
          {
            language: 'es',
            key: 'Account',
            value: 'Cuenta',
            context: { id: 'context 2', label: 'System', type: 'Uwazi UI' },
          },
          {
            language: 'es',
            key: 'Password',
            value: 'Contraseña',
            context: { id: 'context 2', label: 'System', type: 'Uwazi UI' },
          },
          {
            language: 'es',
            key: 'Account',
            value: 'Cuenta',
            context: { id: 'System', label: 'System', type: 'Uwazi UI' },
          },
          {
            language: 'es',
            key: 'Password',
            value: 'Contraseña',
            context: { id: 'System', label: 'System', type: 'Uwazi UI' },
          },
        ],
      });

      const [english] = await translations.get({ context: 'System' });
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
    });
  });

  describe('updateContext', () => {
    it('should properly change context name, key names, values for the keys changed and deleteProperties, and create new values as new translations', async () => {
      await testingDB.setupFixturesAndContext(fixtures);

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

  describe('addContext()', () => {
    it('should add a context with its values', async () => {
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
