import { CsvPreflightJob } from '../CsvPreflightJob';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport';

const noop = jest.fn();

const createTransactionManager = () =>
  ({
    run: jest.fn(async (fn: any) => fn()),
  }) as any;

describe('CsvPreflightJob error handling', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line max-statements
  it('should persist failure and emit onError when an unexpected error occurs', async () => {
    const transactionManager = createTransactionManager();
    const csvImport = CsvImportDomain.withStorage(
      CsvImportDomain.create({
        id: 'import',
        templateId: 'template',
        file: {
          originalName: 'orig.csv',
          mimeType: 'text/csv',
          size: 10,
        },
        createdBy: 'user',
      }),
      'csv-imports/import/orig.csv'
    );

    const csvImportsDS = {
      getById: jest.fn().mockResolvedValue(csvImport),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const rowsDS = {
      getByImport: jest.fn().mockRejectedValue(new Error('rows explode')),
    };

    const useCase = new CsvPreflightJob({
      csvImportsDS: csvImportsDS as any,
      rowsDS: rowsDS as any,
      templatesDS: { getById: jest.fn() } as any,
      settingsDS: {
        getLanguageKeys: jest.fn(),
        getDefaultLanguageKey: jest.fn(),
        get: jest.fn(),
      } as any,
      thesauriDS: {
        appendRootLabelsIfMissing: noop,
        appendNestedLabelsIfMissing: noop,
      },
      thesauriValuesDS: {
        replacePlan: jest.fn(),
      } as any,
      transactionManager,
    });

    const callbacks = {
      onStart: jest.fn(),
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };

    await expect(useCase.execute({ importId: 'import', callbacks })).rejects.toThrow(
      'rows explode'
    );

    expect(callbacks.onError).toHaveBeenCalledWith({
      importId: 'import',
      error: expect.any(Error),
    });

    expect(csvImportsDS.update).toHaveBeenCalledTimes(2);
    const failureUpdate = csvImportsDS.update.mock.calls[1][0];
    expect(failureUpdate.status).toBe(CsvImportStatus.Retrying);
    expect(failureUpdate.failure).toEqual(
      expect.objectContaining({
        message: 'rows explode',
        stage: 'preflight:thesauri',
        retryable: true,
      })
    );
  });
});
