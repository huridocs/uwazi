/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoThesaurusMapper } from '#api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper.js';
import { ThesaurusDBO } from '#api/core/infrastructure/mongodb/thesauri/ThesaurusDBO.js';
import { ThesaurusDiff } from '#api/core/domain/thesaurus/ThesaurusDiff.js';
import { ThesaurusTranslationService } from '../ThesaurusTranslationService.js';
import { SettingsDataSource } from '../../contracts/SettingsDataSource.js';
import { factory, fixtures } from './ThesaurusTranslationServiceFixtures.js';

type Props = {
  settingsDS?: SettingsDataSource;
  translationsDS?: TranslationsDataSource;
};

const createSut = (props?: Props) => {
  const settingsDS =
    props?.settingsDS ??
    TestUtils.mockClass<SettingsDataSource>({
      getInstalledLanguages: jest.fn().mockResolvedValue([{ key: 'en' }, { key: 'es' }]),
    });

  const translationsDS =
    props?.translationsDS ?? TestUtils.mockClass<TranslationsDataSource>({ insert: jest.fn() });

  const sut = new ThesaurusTranslationService({
    settingsDS,
    translationsDS,
  });

  return { sut, settingsDS, translationsDS };
};

describe('ThesaurusTranslationService', () => {
  describe('Create', () => {
    it('should create translation entries for thesaurus name', async () => {
      const { sut, translationsDS } = createSut();

      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [],
      });

      await sut.create(thesaurus);

      expect(translationsDS.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'Countries',
            value: 'Countries',
            language: 'en',
            context: {
              type: 'Thesaurus',
              label: 'Countries',
              id: thesaurus.id,
            },
          }),
          expect.objectContaining({
            key: 'Countries',
            value: 'Countries',
            language: 'es',
            context: {
              type: 'Thesaurus',
              label: 'Countries',
              id: thesaurus.id,
            },
          }),
        ])
      );
    });

    it('should create translation entries for root values', async () => {
      const { sut, translationsDS } = createSut();

      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [{ label: 'USA' }, { label: 'Canada' }],
      });

      await sut.create(thesaurus);

      const insertedTranslations = (translationsDS.insert as jest.Mock).mock
        .calls[0][0] as Translation[];

      expect(insertedTranslations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'USA', value: 'USA', language: 'en' }),
          expect.objectContaining({ key: 'USA', value: 'USA', language: 'es' }),
          expect.objectContaining({ key: 'Canada', value: 'Canada', language: 'en' }),
          expect.objectContaining({ key: 'Canada', value: 'Canada', language: 'es' }),
        ])
      );
    });

    it('should create flattened translation entries for nested values', async () => {
      const { sut, translationsDS } = createSut();

      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [
          {
            label: 'Europe',
            values: [{ label: 'France' }, { label: 'Germany' }],
          },
        ],
      });

      await sut.create(thesaurus);

      const insertedTranslations = (translationsDS.insert as jest.Mock).mock
        .calls[0][0] as Translation[];

      // Should include parent label
      expect(insertedTranslations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'Europe', value: 'Europe', language: 'en' }),
          expect.objectContaining({ key: 'Europe', value: 'Europe', language: 'es' }),
        ])
      );

      // Should include child labels (flattened, not nested)
      expect(insertedTranslations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'France', value: 'France', language: 'en' }),
          expect.objectContaining({ key: 'France', value: 'France', language: 'es' }),
          expect.objectContaining({ key: 'Germany', value: 'Germany', language: 'en' }),
          expect.objectContaining({ key: 'Germany', value: 'Germany', language: 'es' }),
        ])
      );
    });
    it('should not create duplicate entries for same label appearing multiple times', async () => {
      const { sut, translationsDS } = createSut();

      const thesaurus = Thesaurus.create({
        name: 'Test',
        values: [
          { label: 'Group A', values: [{ label: 'Item' }] },
          { label: 'Group B', values: [{ label: 'Item' }] },
        ],
      });

      await sut.create(thesaurus);

      const insertedTranslations = (translationsDS.insert as jest.Mock).mock
        .calls[0][0] as Translation[];

      // 'Item' appears twice but should only have 2 entries (one per language)
      const itemTranslations = insertedTranslations.filter(t => t.key === 'Item');
      expect(itemTranslations).toHaveLength(2);
      expect(itemTranslations.map(t => t.language)).toEqual(expect.arrayContaining(['en', 'es']));
    });
  });

  describe('Update', () => {
    const getThesaurus = async (_id: ObjectId) =>
      testingEnvironment!
        .db!.getCollection('dictionaries')!
        .findOne<ThesaurusDBO>({ _id })
        .then(doc => MongoThesaurusMapper.toDomain(doc!));

    const createDefaultSut = () => {
      const transactionManager = TransactionManagerFactory.default();
      const settingsDS = SettingsDataSourceFactory.default(transactionManager);
      const translationsDS = DefaultTranslationsDataSource(transactionManager);

      const { sut } = createSut({ settingsDS, translationsDS });

      return { sut };
    };

    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixtures);
    });

    afterAll(async () => {
      await testingEnvironment.tearDown();
    });

    it('should create translations for added thesaurus values', async () => {
      const { sut } = createDefaultSut();

      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');
      const before = await getThesaurus(factory.id('countries'));
      const after = before.update({ values: [...before.values, { label: 'Mexico' }] });

      const diff = new ThesaurusDiff({ before, after });

      await sut.update(diff);

      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');

      const createdTranslations = translationsAfter.filter(
        t => !translationsBefore.some(tb => tb._id.equals(t._id))
      );

      const existingTranslations = translationsAfter.filter(t =>
        translationsBefore.some(tb => tb._id.equals(t._id))
      );

      expect(existingTranslations).toEqual(translationsBefore);

      expect(createdTranslations).toEqual([
        {
          _id: expect.any(ObjectId),
          key: 'Mexico',
          value: 'Mexico',
          language: 'en',
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
        },
        {
          _id: expect.any(ObjectId),
          key: 'Mexico',
          value: 'Mexico',
          language: 'es',
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
        },
      ]);
    });

    it('should delete translations for removed thesaurus values', async () => {
      const { sut } = createDefaultSut();

      const before = await getThesaurus(factory.id('countries'));
      const after = before.update({ values: before.values.filter(v => v.label !== 'Canada') });

      const diff = new ThesaurusDiff({ before, after });

      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');

      await sut.update(diff);

      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');

      const deletedTranslations = translationsBefore.filter(
        t => !translationsAfter.some(ta => ta._id.equals(t._id))
      );

      expect(translationsBefore.filter(t => t.key !== 'Canada')).toEqual(translationsAfter);

      expect(deletedTranslations).toEqual([
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Canada',
          language: 'en',
          value: 'Canada',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Canada',
          language: 'es',
          value: 'Canada ES',
        },
      ]);
    });

    it('should update translations for updated thesaurus values', async () => {
      const { sut } = createDefaultSut();

      const before = await getThesaurus(factory.id('countries'));
      const after = before.update({
        values: [
          { ...before.values[0], label: 'USA Updated' },
          before.values[1],
          {
            ...before.values[2],
            label: 'Europe Updated',
            values: [
              { ...before.values[2].values![0], label: 'France Updated' },
              ...before.values[2].values!,
            ],
          },
        ],
      });

      const diff = new ThesaurusDiff({ before, after });

      await sut.update(diff);

      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');

      expect(translationsAfter).toEqual([
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Countries',
          language: 'en',
          value: 'Countries',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'USA Updated',
          language: 'en',
          value: 'USA Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Canada',
          language: 'en',
          value: 'Canada',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Europe Updated',
          language: 'en',
          value: 'Europe Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'France Updated',
          language: 'en',
          value: 'France Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Germany',
          language: 'en',
          value: 'Germany',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Countries',
          language: 'es',
          value: 'Countries ES',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'USA Updated',
          language: 'es',
          value: 'USA ES',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Canada',
          language: 'es',
          value: 'Canada ES',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Europe Updated',
          language: 'es',
          value: 'Europe ES',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'France Updated',
          language: 'es',
          value: 'France ES',
        },
        {
          _id: expect.any(ObjectId),
          context: { type: 'Thesaurus', label: 'Countries', id: diff.id },
          key: 'Germany',
          language: 'es',
          value: 'Germany ES',
        },
      ]);
    });

    it('should update translations for updated thesaurus name', async () => {
      const { sut } = createDefaultSut();

      const before = await getThesaurus(factory.id('countries'));
      const after = before.update({ name: 'Countries Updated' });

      const diff = new ThesaurusDiff({ before, after });

      const translationsBefore = await testingEnvironment.db.getAllFrom('translationsV2');

      await sut.update(diff);

      const translationsAfter = await testingEnvironment.db.getAllFrom('translationsV2');

      const updatedTranslations = translationsAfter.filter(t => t.key === 'Countries Updated');

      expect(translationsBefore.length).toBe(translationsAfter.length);

      expect(updatedTranslations).toEqual(
        expect.arrayContaining([
          {
            _id: expect.any(ObjectId),
            context: { type: 'Thesaurus', label: 'Countries Updated', id: diff.id },
            key: 'Countries Updated',
            language: 'en',
            value: 'Countries Updated',
          },
          {
            _id: expect.any(ObjectId),
            context: { type: 'Thesaurus', label: 'Countries Updated', id: diff.id },
            key: 'Countries Updated',
            language: 'es',
            value: 'Countries ES',
          },
        ])
      );

      expect(translationsAfter.some(t => t.key === 'Countries' && t.context.id === diff.id)).toBe(
        false
      );
    });

    it('should handle create/update/remove correctly', async () => {
      const { sut } = createDefaultSut();

      const before = await getThesaurus(factory.id('countries'));
      const after = before.update({
        name: 'Countries Updated',
        values: [
          // Changed USA to USA Updated
          { ...before.values[0], label: 'USA Updated' },

          // New Value
          { label: 'Brazil' },

          {
            ...before.values[2],
            // Changed Europe to Europe Updated
            label: 'Europe Updated',
            values: [
              // Changed France to USA
              { ...before.values[2].values![0], label: 'USA' },

              // New Value
              { label: 'Italy' },
            ],
          },
        ],
      });

      const diff = new ThesaurusDiff({ before, after });

      await sut.update(diff);

      const translationsAfter = await testingEnvironment.db
        .getCollection('translationsV2')!
        .find({ 'context.id': diff.id })
        .toArray();

      expect(translationsAfter).toEqual([
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Brazil',
          language: 'en',
          value: 'Brazil',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Brazil',
          language: 'es',
          value: 'Brazil',
        },

        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Countries Updated',
          language: 'en',
          value: 'Countries Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Countries Updated',
          language: 'es',
          value: 'Countries ES',
        },

        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Europe Updated',
          language: 'en',
          value: 'Europe Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Europe Updated',
          language: 'es',
          value: 'Europe ES',
        },

        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Italy',
          language: 'en',
          value: 'Italy',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'Italy',
          language: 'es',
          value: 'Italy',
        },

        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'USA',
          language: 'en',
          value: 'USA',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'USA',
          language: 'es',
          value: 'USA ES',
        },

        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'USA Updated',
          language: 'en',
          value: 'USA Updated',
        },
        {
          _id: expect.any(ObjectId),
          context: {
            id: diff.id,
            label: 'Countries Updated',
            type: 'Thesaurus',
          },
          key: 'USA Updated',
          language: 'es',
          value: 'USA Updated',
        },
      ]);

      // // Verify all changes were applied correctly
      // expect(
      //   translationsAfter.some(
      //     t => t.key === 'Countries Updated' && t.context.label === 'Countries Updated'
      //   )
      // ).toBe(true);

      // expect(
      //   translationsAfter.some(
      //     t => t.key === 'USA Updated' && t.language === 'en' && t.value === 'USA Updated'
      //   )
      // ).toBe(true);

      // expect(
      //   translationsAfter.some(
      //     t => t.key === 'Brazil' && t.language === 'en' && t.value === 'Brazil'
      //   )
      // ).toBe(true);

      // expect(
      //   translationsAfter.some(
      //     t => t.key === 'France Updated' && t.language === 'en' && t.value === 'France Updated'
      //   )
      // ).toBe(true);

      // expect(
      //   translationsAfter.some(t => t.key === 'Italy' && t.language === 'en' && t.value === 'Italy')
      // ).toBe(true);

      // // Old keys should be removed
      // expect(translationsAfter.some(t => t.key === 'Canada')).toBe(false);
      // expect(translationsAfter.some(t => t.key === 'Germany')).toBe(false);
      // expect(translationsAfter.some(t => t.key === 'Countries' && !t.key.includes('Updated'))).toBe(
      //   false
      // );
    });
  });
});
