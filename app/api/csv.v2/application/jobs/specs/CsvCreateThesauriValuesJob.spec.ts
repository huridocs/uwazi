/* eslint-disable max-statements */
import { Result } from 'api/core/libs/Result';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues';
import { CsvCreateThesauriValuesJob } from '../CsvCreateThesauriValuesJob';

const createTransactionManager = () =>
  ({
    run: jest.fn(async (fn: any) => fn()),
  }) as any;

describe('CsvCreateThesauriValuesJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should append missing values, update translations, and persist stats', async () => {
    const transactionManager = createTransactionManager();
    const csvImport = CsvImportDomain.create({
      id: 'import-id',
      templateId: 'template-id',
      file: { originalName: 'file.csv', mimeType: 'text/csv', size: 10 },
      createdBy: 'user-id',
    });
    const csvImportsDS = {
      getById: jest.fn().mockResolvedValue(Result.ok(csvImport)),
      update: jest.fn().mockResolvedValue(undefined),
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
    const thesauriValuesDS = {
      getByImport: jest.fn().mockResolvedValue(pendingDocs),
      markAsApplied: jest.fn().mockResolvedValue(undefined),
    };
    const thesauriRepo = {
      getById: jest.fn().mockResolvedValue({ _id: 'thes', values: [] }),
      appendValues: jest.fn().mockResolvedValue({
        _id: 'thes',
        values: [
          {
            id: 'root-id',
            label: 'Country',
            values: [{ id: 'child-id', label: 'Country::City' }],
          },
        ],
      }),
    };
    const translationsRepo = {
      updateEntries: jest.fn().mockResolvedValue(undefined),
    };
    const jobsDispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new CsvCreateThesauriValuesJob({
      csvImportsDS: csvImportsDS as any,
      thesauriValuesDS: thesauriValuesDS as any,
      thesauriRepo: thesauriRepo as any,
      translationsRepo: translationsRepo as any,
      transactionManager,
      jobsDispatcher: jobsDispatcher as any,
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

    expect(thesauriRepo.appendValues).toHaveBeenCalled();
    expect(translationsRepo.updateEntries).toHaveBeenCalledWith('thes', {
      en: { Country: 'Country', 'Country::City': 'City' },
      es: { Country: 'País', 'Country::City': 'Ciudad' },
    });
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
    const finalUpdate = csvImportsDS.update.mock.calls.pop()?.[0];
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
