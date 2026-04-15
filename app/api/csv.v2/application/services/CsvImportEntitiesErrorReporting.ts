import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CsvImportDomain } from '../../domain/CsvImport.js';
import { RowErrorCode } from '../../domain/CsvImportRowError.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';

type RowErrorsReport = {
  failedRows: number;
  reportPath?: string;
};

const buildFileContents = (content: string) =>
  new FileContents(async function* streamCallback() {
    const encoder = new TextEncoder();
    yield encoder.encode(content);
  });

const escapeCsvValue = (value: string) => {
  if (value === undefined || value === null) {
    return '';
  }
  const stringValue = String(value);
  if (/["\n\r,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsvRow = (values: string[]) => values.map(value => escapeCsvValue(value)).join(',');

const getReportableRowIndexes = async (params: {
  importId: string;
  rowErrorsDS: CsvImportRowErrorsDataSource;
}): Promise<number[]> => {
  const { importId, rowErrorsDS } = params;
  const errors = await rowErrorsDS.getByImport(importId);
  const reportableErrors = errors.filter(error => error.code !== RowErrorCode.RowEmptyOrMalformed);
  return reportableErrors.map(error => error.rowIndex);
};

const buildFailedRowsCsv = async (params: {
  importId: string;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  rowsDS: CsvImportRowsDataSource;
}): Promise<string | undefined> => {
  const { importId, rowErrorsDS, rowsDS } = params;
  const indexes = await getReportableRowIndexes({ importId, rowErrorsDS });
  if (!indexes.length) {
    return undefined;
  }
  const rows = await rowsDS.getByImportAndIndexes(importId, indexes);
  if (!rows.length) {
    return undefined;
  }

  const { headers } = rows[0];
  const lines = [buildCsvRow(headers), ...rows.map(row => buildCsvRow(row.values))];
  return lines.join('\n');
};

const updateImportReportStats = async (params: {
  csvImportsDS: CsvImportsDataSource;
  transactionManager: TransactionManager;
  importId: string;
  totalRows: number;
  failedRows: number;
  reportPath?: string;
}) => {
  const { csvImportsDS, transactionManager, importId, totalRows, failedRows, reportPath } = params;

  await transactionManager.run(async () => {
    const csvImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    const withStats = CsvImportDomain.from(csvImport).withStats({
      ...(csvImport.stats || {}),
      rowsProcessed: totalRows,
      rowsFailed: failedRows,
    });
    const updated = reportPath
      ? withStats.withRowErrors({
          failedRows,
          reportPath,
        })
      : withStats;
    await csvImportsDS.update(updated);
  });
};

const buildReportPath = (importId: string) => `csv-imports/${importId}/reports/failed_rows.csv`;

const persistNoFailureStats = async (params: {
  csvImportsDS: CsvImportsDataSource;
  transactionManager: TransactionManager;
  importId: string;
  totalRows: number;
}) => {
  const { csvImportsDS, transactionManager, importId, totalRows } = params;
  await updateImportReportStats({
    csvImportsDS,
    transactionManager,
    importId,
    totalRows,
    failedRows: 0,
  });
};

const storeFailedRowsReport = async (params: {
  importId: string;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  rowsDS: CsvImportRowsDataSource;
  fileStorage: FileStorage;
}) => {
  const { importId, rowErrorsDS, rowsDS, fileStorage } = params;
  const csvContent = await buildFailedRowsCsv({ importId, rowErrorsDS, rowsDS });
  if (!csvContent) {
    return undefined;
  }

  const reportPath = buildReportPath(importId);
  await fileStorage.storeContent(buildFileContents(csvContent), reportPath);
  return reportPath;
};

const persistRowErrorsReport = async (params: {
  importId: string;
  totalRows: number;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  rowsDS: CsvImportRowsDataSource;
  csvImportsDS: CsvImportsDataSource;
  transactionManager: TransactionManager;
  fileStorage: FileStorage;
}): Promise<RowErrorsReport> => {
  const {
    importId,
    totalRows,
    rowErrorsDS,
    rowsDS,
    csvImportsDS,
    transactionManager,
    fileStorage,
  } = params;

  const failedRows = await rowErrorsDS.countByImport(importId);
  if (!failedRows) {
    await persistNoFailureStats({
      csvImportsDS,
      transactionManager,
      importId,
      totalRows,
    });
    return { failedRows: 0, reportPath: undefined };
  }

  const reportPath = await storeFailedRowsReport({
    importId,
    rowErrorsDS,
    rowsDS,
    fileStorage,
  });
  if (!reportPath) {
    return { failedRows, reportPath: undefined };
  }

  await updateImportReportStats({
    csvImportsDS,
    transactionManager,
    importId,
    totalRows,
    failedRows,
    reportPath,
  });

  return { failedRows, reportPath };
};

const evaluateStopPolicy = (params: {
  processedRows: number;
  totalFailures: number;
  maxConsecutiveFailures: number;
  warmupRows: number;
  failureRatioStop: number;
  consecutiveStop: number;
  absoluteStop: number;
}): { shouldStop: boolean; reason?: string } => {
  const {
    processedRows,
    totalFailures,
    maxConsecutiveFailures,
    warmupRows,
    failureRatioStop,
    consecutiveStop,
    absoluteStop,
  } = params;
  if (processedRows >= warmupRows) {
    const failureRatio = processedRows ? totalFailures / processedRows : 0;
    if (failureRatio >= failureRatioStop) {
      return {
        shouldStop: true,
        reason: `Stopped: failure ratio ${failureRatio.toFixed(2)} exceeds threshold`,
      };
    }
  }

  if (maxConsecutiveFailures >= consecutiveStop) {
    return {
      shouldStop: true,
      reason: `Stopped: ${maxConsecutiveFailures} consecutive failures`,
    };
  }

  if (totalFailures >= absoluteStop) {
    return {
      shouldStop: true,
      reason: `Stopped: ${totalFailures} total failures`,
    };
  }

  return { shouldStop: false };
};

export { persistRowErrorsReport, evaluateStopPolicy };
export type { RowErrorsReport };
