import { FileContents } from 'api/core/domain/files/FileContents';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { CsvImportDomain } from '../../domain/CsvImport';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';

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

const buildFailedRowsCsv = async (params: {
  importId: string;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  rowsDS: CsvImportRowsDataSource;
}): Promise<string | undefined> => {
  const { importId, rowErrorsDS, rowsDS } = params;
  const errors = await rowErrorsDS.getByImport(importId);
  if (!errors.length) {
    return undefined;
  }
  const indexes = errors.map(error => error.rowIndex);
  const rows = await rowsDS.getByImportAndIndexes(importId, indexes);
  if (!rows.length) {
    return undefined;
  }
  const headers = rows[0].headers;
  const lines = [buildCsvRow(headers)];
  rows.forEach(row => {
    lines.push(buildCsvRow(row.values));
  });
  return lines.join('\n');
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
  const { importId, totalRows, rowErrorsDS, rowsDS, csvImportsDS, transactionManager, fileStorage } =
    params;
  const failedRows = await rowErrorsDS.countByImport(importId);
  if (!failedRows) {
    await transactionManager.run(async () => {
      const csvImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
      const updated = CsvImportDomain.from(csvImport).withStats({
        ...(csvImport.stats || {}),
        rowsProcessed: totalRows,
        rowsFailed: 0,
      });
      await csvImportsDS.update(updated);
    });
    return { failedRows, reportPath: undefined };
  }

  const csvContent = await buildFailedRowsCsv({ importId, rowErrorsDS, rowsDS });
  if (!csvContent) {
    return { failedRows, reportPath: undefined };
  }

  const reportPath = `csv-imports/${importId}/reports/failed_rows.csv`;
  await fileStorage.storeContent(buildFileContents(csvContent), reportPath);

  await transactionManager.run(async () => {
    const csvImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
    const updated = CsvImportDomain.from(csvImport)
      .withStats({
        ...(csvImport.stats || {}),
        rowsProcessed: totalRows,
        rowsFailed: failedRows,
      })
      .withRowErrors({
        failedRows,
        reportPath,
      });
    await csvImportsDS.update(updated);
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
