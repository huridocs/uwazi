import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { Result } from '#api/core/libs/Result.js';
import { PendingThesauriValuesApplier } from '../PendingThesauriValuesApplier.js';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues.js';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { Translation, TranslationContext } from '#api/i18n.v2/model/Translation.js';
import { TranslationContextModel } from '#api/i18n.v2/model/TranslationContextModel.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { BulkDeleteKeysByContext, UpdateKeysByContextProps } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Id } from '#api/core/libs/Id.js';

class InMemoryResultSet<T> implements ResultSet<T> {
  constructor(private values: T[]) {}

  async all() {
    return this.values;
  }

  async page(number: number, size: number) {
    const start = Math.max(0, number * size);
    return this.values.slice(start, start + size);
  }

  async first() {
    return this.values[0] ?? null;
  }

  async hasNext() {
    return false;
  }

  async nextBatch(size: number) {
    return this.values.slice(0, size);
  }

  async forEach(callback: (item: T) => Promise<void | boolean> | void | boolean) {
    for (const item of this.values) {
      const result = await callback(item);
      if (result === false) {
        break;
      }
    }
  }

  async forEachBatch(
    batchSize: number,
    callback: (items: T[]) => Promise<void | boolean> | void | boolean
  ) {
    const firstBatch = this.values.slice(0, batchSize);
    await callback(firstBatch);
  }

  async find(predicate: (item: T) => Promise<boolean> | boolean) {
    for (const item of this.values) {
      if (await predicate(item)) {
        return item;
      }
    }
    return null;
  }

  async every(predicate: (item: T) => Promise<boolean> | boolean) {
    for (const item of this.values) {
      if (!(await predicate(item))) {
        return false;
      }
    }
    return true;
  }

  async some(predicate: (item: T) => Promise<boolean> | boolean) {
    for (const item of this.values) {
      if (await predicate(item)) {
        return true;
      }
    }
    return false;
  }

  async indexed(predicate: (item: T) => string | number) {
    return this.values.reduce<Record<string | number, Awaited<T>>>((acc, item) => {
      acc[predicate(item)] = item as Awaited<T>;
      return acc;
    }, {});
  }
}

class FakeTranslationsDataSource implements TranslationsDataSource {
  public upsertCalls: Translation[][] = [];

  async insert(translations: Translation[]): Promise<Translation[]> {
    return translations;
  }

  async upsert(translations: Translation[]): Promise<Translation[]> {
    this.upsertCalls.push(translations);
    return translations;
  }

  getAll(): ResultSet<Translation> {
    return new InMemoryResultSet<Translation>([]);
  }

  getByLanguage(_language: string): ResultSet<Translation> {
    return new InMemoryResultSet<Translation>([]);
  }

  getByContext(_context: string): ResultSet<Translation> {
    return new InMemoryResultSet<Translation>([]);
  }

  getContextAndKeys(_contextId: string, _keys: string[]): ResultSet<Translation> {
    return new InMemoryResultSet<Translation>([]);
  }

  async deleteByContextId(_contextId: string): Promise<DeleteResult> {
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteByLanguage(_language: string): Promise<DeleteResult> {
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteKeysByContext(_contextId: string, _keysToDelete: string[]): Promise<DeleteResult> {
    return { acknowledged: true, deletedCount: 0 };
  }

  async bulkDeleteKeysByContext(_props: BulkDeleteKeysByContext): Promise<void> {}

  async updateContextLabel(_contextId: string, _contextLabel: string): Promise<UpdateResult> {
    return {
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: null,
    };
  }

  async updateKeysByContext(_contextId: string, _keyChanges: { [p: string]: string }): Promise<void> {}

  async updateKeysByContextV2(_props: UpdateKeysByContextProps): Promise<void> {}

  async calculateNonexistentKeys(_contextId: string, keys: string[]): Promise<string[]> {
    return keys;
  }

  async getContext(
    _contextInfo: TranslationContext,
    _languages: LanguageISO6391[],
    _defaultLanguage: LanguageISO6391
  ): Promise<TranslationContextModel> {
    throw new Error('not implemented');
  }

  async updateContext(_context: TranslationContextModel): Promise<void> {}
}

class FakeThesauriDataSource implements ThesauriDataSource {
  constructor(private thesaurus: ThesaurusSchema) {}

  async getById(_id: string) {
    return Result.ok(toCoreThesaurus(this.thesaurus));
  }

  async exists(_thesaurus: Thesaurus) {
    return Result.ok<false>(false);
  }

  async create(_thesaurus: Thesaurus) {}

  async update(nextThesaurus: Thesaurus): Promise<void> {
    this.thesaurus = {
      _id: nextThesaurus.id,
      name: nextThesaurus.name,
      values: nextThesaurus.values.map(root => ({
        id: root.id,
        label: root.label,
        values: root.values?.map(child => ({
          id: child.id,
          label: child.label,
        })),
      })),
    };
  }
}

const toCoreThesaurus = (schema: ThesaurusSchema) =>
  new Thesaurus({
    id: typeof schema._id === 'string' ? schema._id : schema._id?.toString() || 'thesaurus-id',
    name: schema.name,
    values:
      schema.values?.map(root => ({
        id: root.id ?? new Id({}).value,
        label: root.label,
        values: root.values?.map(child => ({
          id: child.id ?? new Id({}).value,
          label: child.label,
        })),
      })) || [],
  });

const buildPendingDoc = ({
  importId,
  thesaurusId,
  rootLabel,
  childLabel,
}: {
  importId: string;
  thesaurusId: string;
  rootLabel: string;
  childLabel?: string;
}) => {
  const entry = new CsvThesauriPendingEntry({
    propertyId: 'prop-id',
    propertyName: 'prop-name',
    thesaurusId,
    type: 'select',
  });
  const root = entry.ensureRoot({
    label: rootLabel,
    normalized: rootLabel.toLowerCase(),
    languages: { en: rootLabel },
  });
  if (childLabel) {
    root.ensureChild({
      label: childLabel,
      normalized: childLabel.toLowerCase(),
      languages: { en: childLabel },
    });
  }
  return CsvImportThesauriValues.create({
    importId,
    thesaurusId,
    createdAt: Date.now(),
    entries: [entry],
  });
};

describe('PendingThesauriValuesApplier', () => {
  it('should include existing IDs in appliedValues when no appends are needed', async () => {
    const thesaurusId = 'th-1';
    const existing: ThesaurusSchema = {
      name: 'th',
      values: [
        {
          id: 'root-id',
          label: 'Root',
          values: [{ id: 'child-id', label: 'Child' }],
        },
      ],
    };

    const translationsDS = new FakeTranslationsDataSource();
    const applier = new PendingThesauriValuesApplier({
      thesauriDS: new FakeThesauriDataSource(existing),
      translationsDS,
    });

    const pendingDoc = buildPendingDoc({
      importId: 'imp-1',
      thesaurusId,
      rootLabel: 'Root',
      childLabel: 'Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend).toHaveLength(0);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        { label: 'Root', valueId: 'root-id' },
        { label: 'Child', parentLabel: 'Root', valueId: 'child-id' },
      ])
    );
  });

  it('should capture newly appended IDs in appliedValues', async () => {
    const thesaurusId = 'th-2';
    const translationsDS = new FakeTranslationsDataSource();
    const applier = new PendingThesauriValuesApplier({
      thesauriDS: new FakeThesauriDataSource({ _id: thesaurusId, name: 'th', values: [] }),
      translationsDS,
    });

    const pendingDoc = buildPendingDoc({
      importId: 'imp-2',
      thesaurusId,
      rootLabel: 'New Root',
      childLabel: 'New Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(appliedValues).toHaveLength(2);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'New Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'New Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });

  // eslint-disable-next-line max-statements
  it('should include existing and new values together', async () => {
    const thesaurusId = 'th-3';
    const existing: ThesaurusSchema = {
      name: 'th',
      values: [
        {
          id: 'root-id',
          label: 'Root',
          values: [{ id: 'existing-child-id', label: 'Existing Child' }],
        },
        {
          id: 'standalone-id',
          label: 'Standalone Existing',
        },
      ],
    };

    const translationsDS = new FakeTranslationsDataSource();
    const applier = new PendingThesauriValuesApplier({
      thesauriDS: new FakeThesauriDataSource(existing),
      translationsDS,
    });

    const entry = new CsvThesauriPendingEntry({
      propertyId: 'prop-id',
      propertyName: 'prop-name',
      thesaurusId,
      type: 'select',
    });
    const root = entry.ensureRoot({
      label: 'Root',
      normalized: 'root',
      languages: { en: 'Root' },
    });
    root.ensureChild({
      label: 'Existing Child',
      normalized: 'existing child',
      languages: { en: 'Existing Child' },
    });
    root.ensureChild({
      label: 'New Child',
      normalized: 'new child',
      languages: { en: 'New Child' },
    });

    const standalone = entry.ensureRoot({
      label: 'Standalone Existing',
      normalized: 'standalone existing',
      languages: { en: 'Standalone Existing' },
    });
    standalone.ensureChild({
      label: 'New Standalone Child',
      normalized: 'new standalone child',
      languages: { en: 'New Standalone Child' },
    });

    entry.ensureRoot({
      label: 'New Standalone Root',
      normalized: 'new standalone root',
      languages: { en: 'New Standalone Root' },
    });

    const pendingDoc = CsvImportThesauriValues.create({
      importId: 'imp-3',
      thesaurusId,
      createdAt: Date.now(),
      entries: [entry],
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(diff.valuesToAppend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Root',
          values: expect.arrayContaining([expect.objectContaining({ label: 'New Child' })]),
        }),
        expect.objectContaining({
          label: 'Standalone Existing',
          values: expect.arrayContaining([
            expect.objectContaining({ label: 'New Standalone Child' }),
          ]),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
        }),
      ])
    );
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        { label: 'Root', valueId: 'root-id' },
        {
          label: 'Existing Child',
          parentLabel: 'Root',
          valueId: 'existing-child-id',
        },
        { label: 'Standalone Existing', valueId: 'standalone-id' },
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Child',
          parentLabel: 'Standalone Existing',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });
});
