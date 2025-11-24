/* eslint-disable max-lines */
import path from 'path';
import yauzl from 'yauzl';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { FileContents } from 'api/core/domain/files/FileContents';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource';
import { CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport';
import { CsvImportRow } from '../../domain/CsvImportRow';
import { CsvReader } from '../services/CsvReader';
import { CsvReaderError } from '../services/CsvReaderError';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  filesIO: FileContentsIO;
  rowsDS: CsvImportRowsDataSource;
};

type ExtractionProgress =
  | { type: 'files'; importId: string; processedFiles: number }
  | { type: 'rows'; importId: string; stagedRows: number };

type Callbacks = BaseCallbacks & {
  onProgress: (info: ExtractionProgress) => void;
};

type Input = {
  importId: string;
  callbacks: Callbacks;
};

const ROWS_BATCH_SIZE = 500;

export class CsvExtractUploadedZipJob extends AbstractUseCase<Input, void, Deps> {
  private static parseStoragePath(storagePath: string) {
    const filename = path.basename(storagePath);
    const destination = path.dirname(storagePath);
    return { filename, destination };
  }

  private static streamFromReadable(readStream: NodeJS.ReadableStream): AsyncIterable<Uint8Array> {
    async function* streamReadable() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      for await (const chunk of readStream as any) {
        yield chunk as Uint8Array;
      }
    }
    return streamReadable();
  }

  private static emitStart(callbacks: Callbacks, importId: string) {
    callbacks.onStart({ importId });
  }

  private static emitSuccess(callbacks: Callbacks, importId: string) {
    callbacks.onSuccess({ importId });
  }

  private static emitError(callbacks: Callbacks, importId: string, error: Error) {
    callbacks.onError({ importId, error });
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      throw new NonRetryableJobError(new Error(`CSV import not found: ${importId}`));
    }
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(existing, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  private async getImportStoragePath(importId: string) {
    const csvImport = await this.deps.csvImportsDS.getById(importId);
    if (!csvImport?.storage?.path) {
      throw new NonRetryableJobError(new Error('CSV import storage path not found'));
    }
    return csvImport.storage.path;
  }

  private async copyCsvToExtracted(originalDestination: string, originalFilename: string) {
    const source = await this.deps.fileStorage.getFile({
      type: 'customPath',
      destination: originalDestination,
      filename: originalFilename,
    });

    const file = new FileContents(() => source.read());

    await this.deps.fileStorage.storeContent(file, `${originalDestination}/extracted/import.csv`);
  }

  private async extractZipToExtracted(
    importId: string,
    zipDestination: string,
    zipFilename: string,
    callbacks: Callbacks
  ) {
    const zipFileContents = await this.deps.fileStorage.getFile({
      type: 'customPath',
      destination: zipDestination,
      filename: zipFilename,
    });

    const disk = await this.deps.filesIO.toDisk(zipFileContents);
    const zipPath = disk.path;

    const extractedDestination = `${zipDestination}/extracted`;
    let hasImportCsv = false;
    let processedFiles = 0;

    await new Promise<void>((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
        if (err || !zip) {
          reject(err || new Error('Unable to open zip file'));
          return;
        }
        const next = () => zip.readEntry();
        zip.on('entry', entry => {
          if (/\/$/.test(entry.fileName)) {
            next();
            return;
          }

          // Only root-level files are supported/expected
          if (entry.fileName.includes('/')) {
            next();
            return;
          }

          if (entry.fileName === 'import.csv') {
            hasImportCsv = true;
          }

          zip.openReadStream(entry, async (streamErr, readStream) => {
            if (streamErr || !readStream) {
              reject(streamErr || new Error('Failed to read zip entry'));
              return;
            }

            const file = new FileContents(() =>
              CsvExtractUploadedZipJob.streamFromReadable(readStream)
            );

            try {
              await this.deps.fileStorage.storeContent(
                file,
                `${extractedDestination}/${entry.fileName}`
              );
              processedFiles += 1;
              callbacks.onProgress({
                type: 'files',
                importId,
                processedFiles,
              });
              next();
            } catch (e) {
              reject(e);
            }
          });
        });
        zip.on('end', () => resolve());
        zip.on('error', reject);
        next();
      });
    });

    if (!hasImportCsv) {
      throw new NonRetryableJobError(new Error('import.csv not found at zip root'));
    }
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  async handleExtractionSuccess(importId: string) {
    // success: clear any prior failure and mark files extracted
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (existing) {
      await this.transactionManager.run(async () => {
        const cleared = CsvImportDomain.clearFailure(existing);
        const updated = CsvImportDomain.withStatus(cleared, CsvImportStatus.ExtractingFilesDone);
        await this.deps.csvImportsDS.update(updated);
      });
    } else {
      await this.setStatus(importId, CsvImportStatus.ExtractingFilesDone);
    }
  }

  async handleError(importId: string, callbacks: Callbacks, error: Error) {
    CsvExtractUploadedZipJob.emitError(callbacks, importId, error);
    const existing = await this.deps.csvImportsDS.getById(importId);
    const failure = {
      message: error.message,
      retryable: !(error instanceof NonRetryableJobError),
      at: Date.now(),
      stage: 'extracting files',
    };
    if (!existing) {
      // Uncommon: if missing, still surface non-retriable; nothing to persist.
      if (error instanceof NonRetryableJobError) throw error;
      throw error;
    }
    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(existing, failure);
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  private async fetchExtractedCsvFile(destination: string) {
    const extractedDestination = `${destination}/extracted`;
    return this.deps.fileStorage.getFile({
      type: 'customPath',
      destination: extractedDestination,
      filename: 'import.csv',
    });
  }

  private async deleteExistingRows(importId: string) {
    await this.transactionManager.run(async () => {
      await this.deps.rowsDS.deleteByImport(importId);
    });
  }

  private async insertRowsBatch(rows: CsvImportRow[]) {
    if (!rows.length) {
      return;
    }
    await this.transactionManager.run(async () => {
      await this.deps.rowsDS.insertMany(rows);
    });
  }

  private async streamAndPersistRows(
    importId: string,
    file: FileContents,
    callbacks: Callbacks,
    emptyRowIndexes: number[]
  ) {
    const batch: CsvImportRow[] = [];
    let stagedRows = 0;
    let headers: string[] | null = null;
    let emptyPointer = 0;
    let currentIndex = 0;
    const sortedEmptyIndexes = [...emptyRowIndexes].sort((a, b) => a - b);

    const flushBatch = async () => {
      if (!batch.length) {
        return;
      }
      const rowsToInsert = batch.splice(0, batch.length);
      await this.insertRowsBatch(rowsToInsert);
    };

    const flushEmptyRows = async () => {
      if (!headers) {
        return;
      }
      let requiresFlush = false;
      while (sortedEmptyIndexes[emptyPointer] === currentIndex) {
        batch.push({
          importId,
          index: currentIndex,
          headers,
          values: new Array(headers.length).fill(''),
        });
        stagedRows += 1;
        currentIndex += 1;
        emptyPointer += 1;
        if (batch.length >= ROWS_BATCH_SIZE) {
          requiresFlush = true;
        }
        callbacks.onProgress({ type: 'rows', importId, stagedRows });
      }
      if (requiresFlush) {
        await flushBatch();
      }
    };

    await CsvExtractUploadedZipJob.processCsvStream(file, {
      onHeaders: parsedHeaders => {
        headers = parsedHeaders;
      },
      onRow: async ({ values }) => {
        if (!headers) {
          throw new CsvReaderError('CSV header row missing.');
        }
        await flushEmptyRows();
        batch.push({
          importId,
          index: currentIndex,
          headers,
          values,
        });
        stagedRows += 1;
        currentIndex += 1;
        if (batch.length >= ROWS_BATCH_SIZE) {
          await flushBatch();
        }
        callbacks.onProgress({ type: 'rows', importId, stagedRows });
      },
    });

    if (!headers) {
      throw new NonRetryableJobError(new Error('CSV file must contain headers.'));
    }

    await flushEmptyRows();
    await flushBatch();
    callbacks.onProgress({ type: 'rows', importId, stagedRows });
  }

  private static async processCsvStream(
    file: FileContents,
    csvCallbacks: Parameters<typeof CsvReader.stream>[1]
  ) {
    try {
      await CsvReader.stream(file, csvCallbacks);
    } catch (error) {
      if (error instanceof CsvReaderError) {
        throw new NonRetryableJobError(error);
      }
      throw error;
    }
  }

  private async stageRows(importId: string, destination: string, callbacks: Callbacks) {
    const [fileForRows, fileForEmptyDetection] = await Promise.all([
      this.fetchExtractedCsvFile(destination),
      this.fetchExtractedCsvFile(destination),
    ]);
    const emptyRowIndexes = await CsvReader.collectEmptyRowIndexes(fileForEmptyDetection);
    await this.deleteExistingRows(importId);
    await this.streamAndPersistRows(importId, fileForRows, callbacks, emptyRowIndexes);
  }

  private async processExtraction(params: {
    importId: string;
    isZip: boolean;
    destination: string;
    filename: string;
    callbacks: Callbacks;
  }) {
    try {
      if (params.isZip) {
        await this.extractZipToExtracted(
          params.importId,
          params.destination,
          params.filename,
          params.callbacks
        );
      } else {
        await this.copyCsvToExtracted(params.destination, params.filename);
      }

      await this.stageRows(params.importId, params.destination, params.callbacks);
      await this.handleExtractionSuccess(params.importId);
      CsvExtractUploadedZipJob.emitSuccess(params.callbacks, params.importId);
    } catch (e) {
      await this.handleError(params.importId, params.callbacks, e as Error);
      throw e;
    }
  }

  protected async executeAsync(input: Input): Promise<void> {
    const { importId, callbacks } = input;

    CsvExtractUploadedZipJob.emitStart(callbacks, importId);
    await this.setStatus(importId, CsvImportStatus.ExtractingFiles);

    const storagePath = await this.getImportStoragePath(importId);

    const { filename, destination } = CsvExtractUploadedZipJob.parseStoragePath(storagePath);
    const isZip = filename.toLowerCase().endsWith('.zip');

    await this.processExtraction({
      importId,
      isZip,
      destination,
      filename,
      callbacks,
    });
  }
}

export type { Callbacks, ExtractionProgress };
