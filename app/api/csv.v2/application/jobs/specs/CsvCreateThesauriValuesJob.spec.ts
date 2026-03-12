/* eslint-disable max-statements */
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass, JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { CsvImportsDataSource } from '../../contracts/CsvImportsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../contracts/CsvImportThesauriValuesDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { BulkDeleteKeysByContext, UpdateKeysByContextProps } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { DeleteResult, UpdateResult } from 'mongodb';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Translation, TranslationContext } from '#api/i18n.v2/model/Translation.js';
import { TranslationContextModel } from '#api/i18n.v2/model/TranslationContextModel.js';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues.js';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues.js';
import { CsvCreateThesauriValuesJobFactory } from '../../../infrastructure/factories/CsvCreateThesauriValuesJobFactory.js';

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
  public upsert = jest.fn(async (translations: Translation[]) => translations);

  async insert(translations: Translation[]): Promise<Translation[]> {
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

class FakeTransactionManager implements TransactionManager {
  async run<T>(callback: () => Promise<T>): Promise<T> {
    return callback();
  }

  onCommitted(_handler: () => Promise<void>): this {
    return this;
  }

  runHandlingOnCommitted<T>(callback: () => Promise<T>) {
    return {
      onCommitted: async (_handler: (value: T) => Promise<void>) => callback(),
    };
  }

  isRunning(): boolean {
    return false;
  }
}

describe('CsvCreateThesauriValuesJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should append missing values, update translations, and persist stats', async () => {
    const csvImport = CsvImportDomain.create({
      id: 'import-id',
      templateId: 'template-id',
      file: { originalName: 'file.csv', mimeType: 'text/csv', size: 10 },
      createdBy: 'user-id',
    });
    let finalUpdate: CsvImport | undefined;
    const csvImportsDS: CsvImportsDataSource = {
      insert: async () => {},
      cancel: async () => {},
      getById: async () => Result.ok(csvImport),
      update: async doc => {
        finalUpdate = doc;
      },
      isCancelled: async () => false,
    };
    const entry = new CsvThesauriPendingEntry({
      propertyId: 'prop',
      propertyName: 'Property',
      thesaurusId: 'thes',
      type: 'select',
    });
    const root = entry.ensureRoot({
      label: 'Country',
      normalized: 'country',
      languages: { en: 'Country', es: 'País' },
    });
    root.ensureChild({
      label: 'Country::City',
      normalized: 'country::city',
      languages: { en: 'City', es: 'Ciudad' },
    });

    const pendingDocs = [
      CsvImportThesauriValues.create({
        importId: 'import-id',
        thesaurusId: 'thes',
        createdAt: Date.now(),
        entries: [entry],
      }),
    ];
    const thesauriValuesDS: CsvImportThesauriValuesDataSource = {
      replacePendingValues: async () => {},
      deleteByImport: async () => {},
      getByImport: async () => pendingDocs,
      markAsApplied: jest.fn(async () => {}),
    };
    const thesauriDS: ThesauriDataSource = {
      getById: async (_id: string) =>
        Result.ok(
          new Thesaurus({
            id: 'thes',
            name: 'Thesaurus',
            values: [],
          })
        ),
      exists: async (_thesaurus: Thesaurus) => Result.ok<false>(false),
      create: async (_thesaurus: Thesaurus) => {},
      update: jest.fn(async () => {}),
    };
    const translationsDS = new FakeTranslationsDataSource();
    const jobsDispatcher: JobsDispatcher = {
      dispatch: jest.fn(async <T extends Dispatchable>(
        _dispatchable: DispatchableClass<T>,
        _params: Parameters<T['handleDispatch']>[1]
      ) => {}),
      deleteByParams: async () => {},
      dispatchMany: async callback => {
        await callback(async <T extends Dispatchable>(
          _dispatchable: DispatchableClass<T>,
          _params: Parameters<T['handleDispatch']>[1]
        ) => {});
      },
    };
    const { useCase } = CsvCreateThesauriValuesJobFactory.build({
      csvImportsDS,
      thesauriValuesDS,
      thesauriDS,
      translationsDS,
      jobsDispatcher,
      transactionManager: new FakeTransactionManager(),
    });

    const callbacks = {
      onStart: jest.fn(),
      onProgress: jest.fn(),
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };

    await useCase.execute({
      importId: 'import-id',
      tenantName: 'tenant',
      userId: 'user-id',
      callbacks,
    });

    expect(thesauriDS.update).toHaveBeenCalled();
    expect(translationsDS.upsert).toHaveBeenCalled();
    expect(thesauriValuesDS.markAsApplied).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: 'import-id',
        thesaurusId: 'thes',
        stats: expect.objectContaining({
          valuesCreated: 2,
          valuesObserved: 2,
        }),
      })
    );
    expect(finalUpdate?.status).toBe(CsvImportStatus.PreflightThesauriCreateDone);
    expect(finalUpdate?.stats).toEqual(
      expect.objectContaining({
        thesaurusValuesCreated: 2,
        thesaurusValuesObserved: 2,
        thesauriTouched: 1,
      })
    );
    expect(callbacks.onSuccess).toHaveBeenCalledWith({ importId: 'import-id' });
  });
});
