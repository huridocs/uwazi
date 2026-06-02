import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { CsvImportRowErrorsDataSource } from '../../contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRowsDataSource } from '../../contracts/CsvImportRowsDataSource.js';
import { CsvImportsDataSource } from '../../contracts/CsvImportsDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import { CsvImportDomain } from '../../../domain/CsvImport.js';
import { CsvImportRow } from '../../../domain/CsvImportRow.js';
import { CsvImportRowError, RowErrorCode } from '../../../domain/CsvImportRowError.js';
import { persistRowErrorsReport } from '../CsvImportEntitiesErrorReporting.js';

const createImportDoc = (id: string) =>
  CsvImportDomain.withStorage(
    CsvImportDomain.create({
      id,
      templateId: 'template-1',
      createdBy: 'user-1',
      file: {
        originalName: 'import.csv',
        mimeType: 'text/csv',
        size: 10,
      },
    }),
    `csv-imports/${id}/original.csv`
  );

const createTransactionManagerMock = (): TransactionManager =>
  ({
    run: jest.fn(async callback => callback()),
    onCommitted: jest.fn(),
    onRetry: jest.fn(),
    runHandlingOnCommitted: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
  }) as unknown as TransactionManager;

const createFileStorageMock = (): FileStorage =>
  ({
    storeContent: jest.fn().mockResolvedValue(undefined),
  }) as unknown as FileStorage;

const createRowsDataSourceMock = (rows: CsvImportRow[]): CsvImportRowsDataSource => ({
  insertMany: jest.fn(),
  countByImport: jest.fn(),
  getByImport: jest.fn(),
  getByImportAndIndexes: jest.fn().mockResolvedValue(rows),
  deleteByImport: jest.fn(),
});

const createRowErrorsDataSourceMock = (
  count: number,
  errors: CsvImportRowError[]
): CsvImportRowErrorsDataSource => ({
  insertMany: jest.fn(),
  countByImport: jest.fn().mockResolvedValue(count),
  getByImport: jest.fn().mockResolvedValue(errors),
  deleteByImport: jest.fn(),
});

const createCsvImportsDataSourceMock = (
  getPersistedImport: () => ReturnType<typeof createImportDoc>,
  setPersistedImport: (doc: ReturnType<typeof createImportDoc>) => void
): CsvImportsDataSource =>
  ({
    insert: jest.fn(),
    update: jest.fn(async doc => {
      setPersistedImport(doc);
    }),
    cancel: jest.fn(),
    isCancelled: jest.fn(),
    getById: jest.fn(async () => Result.ok(getPersistedImport())),
  }) as CsvImportsDataSource;

const createMixedErrorsScenario = () => {
  const importId = 'import-1';
  let persistedImport = createImportDoc(importId);

  const rowErrorsDS = createRowErrorsDataSourceMock(2, [
    CsvImportRowError.create({
      importId,
      rowIndex: 1,
      code: RowErrorCode.RowEmptyOrMalformed,
      message: 'Empty line.',
    }),
    CsvImportRowError.create({
      importId,
      rowIndex: 3,
      code: RowErrorCode.RelationshipNotFound,
      message: 'Relationship value could not be resolved to an existing entity.',
    }),
  ]);
  const rowsDS = createRowsDataSourceMock([
    CsvImportRow.create({
      importId,
      rowIndex: 3,
      headers: ['title', 'description'],
      values: ['Invalid row', 'Bad relationship'],
    }),
  ]);
  const csvImportsDS = createCsvImportsDataSourceMock(
    () => persistedImport,
    doc => {
      persistedImport = doc;
    }
  );
  return {
    importId,
    rowErrorsDS,
    rowsDS,
    csvImportsDS,
    getPersistedImport: () => persistedImport,
  };
};

describe('CsvImportEntitiesErrorReporting', () => {
  it('filters empty-line errors out of failed_rows.csv while keeping failedRows stats', async () => {
    const { importId, rowErrorsDS, rowsDS, csvImportsDS, getPersistedImport } =
      createMixedErrorsScenario();

    const transactionManager = createTransactionManagerMock();
    const fileStorage = createFileStorageMock();

    const report = await persistRowErrorsReport({
      importId,
      totalRows: 4,
      rowErrorsDS,
      rowsDS,
      csvImportsDS,
      transactionManager,
      fileStorage,
    });

    expect(rowsDS.getByImportAndIndexes).toHaveBeenCalledWith(importId, [3]);
    expect(fileStorage.storeContent).toHaveBeenCalledWith(
      expect.anything(),
      `csv-imports/${importId}/reports/failed_rows.csv`
    );
    expect(report).toEqual({
      failedRows: 2,
      reportPath: `csv-imports/${importId}/reports/failed_rows.csv`,
    });
    expect(getPersistedImport().stats?.rowsFailed).toBe(2);
  });

  it('does not generate failed_rows.csv when all row errors are empty lines', async () => {
    const importId = 'import-2';
    const rowErrorsDS: CsvImportRowErrorsDataSource = {
      insertMany: jest.fn(),
      countByImport: jest.fn().mockResolvedValue(1),
      getByImport: jest.fn().mockResolvedValue([
        CsvImportRowError.create({
          importId,
          rowIndex: 0,
          code: RowErrorCode.RowEmptyOrMalformed,
          message: 'Empty line.',
        }),
      ]),
      deleteByImport: jest.fn(),
    };

    const rowsDS: CsvImportRowsDataSource = {
      insertMany: jest.fn(),
      countByImport: jest.fn(),
      getByImport: jest.fn(),
      getByImportAndIndexes: jest.fn(),
      deleteByImport: jest.fn(),
    };

    const csvImportsDS: CsvImportsDataSource = {
      insert: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      isCancelled: jest.fn(),
      getById: jest.fn(),
    };

    const transactionManager = createTransactionManagerMock();
    const fileStorage = createFileStorageMock();

    const report = await persistRowErrorsReport({
      importId,
      totalRows: 1,
      rowErrorsDS,
      rowsDS,
      csvImportsDS,
      transactionManager,
      fileStorage,
    });

    expect(rowsDS.getByImportAndIndexes).not.toHaveBeenCalled();
    expect(fileStorage.storeContent).not.toHaveBeenCalled();
    expect(report).toEqual({
      failedRows: 1,
      reportPath: undefined,
    });
  });
});
