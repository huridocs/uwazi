import { TestUtils } from 'api/common.v2/utils/Test';
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { Translation } from 'api/i18n.v2/model/Translation';
import { MongoSettingsDataSource } from '../../../infrastructure/mongodb/MongoSettingsDataSource';
import { ThesaurusTranslationService } from '../ThesaurusTranslationService';

const createSut = () => {
  const settingsDS = TestUtils.mockClass<MongoSettingsDataSource>({
    getInstalledLanguages: jest.fn().mockResolvedValue([{ key: 'en' }, { key: 'es' }]),
  });

  const translationsDS = TestUtils.mockClass<any>({ insert: jest.fn() });

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

      const insertedTranslations = translationsDS.insert.mock.calls[0][0] as Translation[];

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

      const insertedTranslations = translationsDS.insert.mock.calls[0][0] as Translation[];

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

      const insertedTranslations = translationsDS.insert.mock.calls[0][0] as Translation[];

      // 'Item' appears twice but should only have 2 entries (one per language)
      const itemTranslations = insertedTranslations.filter(t => t.key === 'Item');
      expect(itemTranslations).toHaveLength(2);
      expect(itemTranslations.map(t => t.language)).toEqual(expect.arrayContaining(['en', 'es']));
    });
  });
});
