import path from 'path';
import yauzl from 'yauzl';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { FileContents } from 'api/files.v2/model/FileContents';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportDomain, CsvImportStatus } from '../model/CsvImport';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileStorage: FileStorage;
  filesIO: FileContentsIO;
};

type Input = {
  importId: string;
};

type Callbacks = {
  onStart?: (info: { importId: string }) => void;
  onSuccess?: (info: { importId: string }) => void;
  onError?: (info: { importId: string; error: Error }) => void;
  onProgress?: (info: { importId: string; processedFiles: number }) => void;
};

export class CsvExtractUploadedZipUseCase extends AbstractUseCase<Input, void, Deps> {
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

  private static emitStart(callbacks: Callbacks | undefined, importId: string) {
    callbacks?.onStart?.({ importId });
  }

  private static emitSuccess(callbacks: Callbacks | undefined, importId: string) {
    callbacks?.onSuccess?.({ importId });
  }

  private static emitError(callbacks: Callbacks | undefined, importId: string, error: Error) {
    callbacks?.onError?.({ importId, error });
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
    callbacks?: Callbacks
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
            // directories not expected per policy; skip
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
              CsvExtractUploadedZipUseCase.streamFromReadable(readStream)
            );

            try {
              await this.deps.fileStorage.storeContent(
                file,
                `${extractedDestination}/${entry.fileName}`
              );
              processedFiles += 1;
              callbacks?.onProgress?.({ importId, processedFiles });
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

  async handleError(importId: string, callbacks: Callbacks | undefined, error: Error) {
    CsvExtractUploadedZipUseCase.emitError(callbacks, importId, error);
    if (error instanceof NonRetryableJobError) {
      await this.markAsFailed(importId);
    } else {
      await this.setStatus(importId, CsvImportStatus.Retrying);
    }
  }

  private async processExtraction(params: {
    importId: string;
    isZip: boolean;
    destination: string;
    filename: string;
    callbacks?: Callbacks;
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

      await this.setStatus(params.importId, CsvImportStatus.FilesExtracted);
      CsvExtractUploadedZipUseCase.emitSuccess(params.callbacks, params.importId);
    } catch (e) {
      await this.handleError(params.importId, params.callbacks, e as Error);
      throw e;
    }
  }

  protected async executeAsync(input: Input, callbacks?: Callbacks): Promise<void> {
    CsvExtractUploadedZipUseCase.emitStart(callbacks, input.importId);

    const storagePath = await this.getImportStoragePath(input.importId);
    await this.setStatus(input.importId, CsvImportStatus.ExtractingFiles);

    const { filename, destination } = CsvExtractUploadedZipUseCase.parseStoragePath(storagePath);
    const isZip = filename.toLowerCase().endsWith('.zip');

    await this.processExtraction({
      importId: input.importId,
      isZip,
      destination,
      filename,
      callbacks,
    });
  }
}
