import yauzl from 'yauzl';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';

type NormalizeParams = {
  importId: string;
  destination: string;
  filename: string;
  onFileProgress: (info: { importId: string; processedFiles: number }) => void;
};

type NormalizedSourceFile = {
  filename: string;
  sizeBytes: number;
  compressedSizeBytes?: number;
};

type NormalizeResult = {
  sourceType: 'zip' | 'csv';
  extractedFilesCount: number;
  totalFilesInZip?: number;
  files: NormalizedSourceFile[];
};

export class CsvImportFileNormalizer {
  constructor(private deps: { fileStorage: FileStorage; filesIO: FileContentsIO }) {}

  // eslint-disable-next-line class-methods-use-this
  private emitProgress(
    callback: (info: { importId: string; processedFiles: number }) => void,
    info: { importId: string; processedFiles: number }
  ) {
    callback(info);
  }

  async normalize(params: NormalizeParams): Promise<NormalizeResult> {
    const lower = params.filename.toLowerCase();
    if (lower.endsWith('.zip')) {
      return this.extractZip(params);
    }
    await this.copyCsv(params.destination, params.filename);
    return {
      sourceType: 'csv',
      extractedFilesCount: 1,
      files: [{ filename: params.filename, sizeBytes: 0 }],
    };
  }

  private async copyCsv(destination: string, filename: string) {
    const source = this.deps.fileStorage.getFile({
      type: 'customPath',
      destination,
      filename,
    });
    await this.deps.fileStorage.storeContent(source, `${destination}/extracted/import.csv`);
  }

  private async extractZip(params: NormalizeParams): Promise<NormalizeResult> {
    const { importId, destination, filename, onFileProgress } = params;
    const zipFileContents = this.deps.fileStorage.getFile({
      type: 'customPath',
      destination,
      filename,
    });
    const disk = await this.deps.filesIO.toDisk(zipFileContents);
    const extractedDestination = `${destination}/extracted`;

    let processedFiles = 0;
    let hasImportCsv = false;
    const files: NormalizedSourceFile[] = [];

    await new Promise<void>((resolve, reject) => {
      yauzl.open(disk.path, { lazyEntries: true }, (err, zip) => {
        if (err || !zip) {
          reject(err || new Error('Unable to open zip file'));
          return;
        }
        const next = () => zip.readEntry();
        zip.on('entry', entry => {
          if (/\/$/.test(entry.fileName) || entry.fileName.includes('/')) {
            next();
            return;
          }
          if (entry.fileName === 'import.csv') {
            hasImportCsv = true;
          }
          files.push({
            filename: entry.fileName,
            sizeBytes: entry.uncompressedSize,
            compressedSizeBytes: entry.compressedSize,
          });
          zip.openReadStream(entry, async (streamErr, readStream) => {
            if (streamErr || !readStream) {
              reject(streamErr || new Error('Failed to read zip entry'));
              return;
            }
            const file = new FileContents(async function* streamReadable() {
              // eslint-disable-next-line no-restricted-syntax
              for await (const chunk of readStream as any) {
                yield chunk as Uint8Array;
              }
            });
            try {
              await this.deps.fileStorage.storeContent(
                file,
                `${extractedDestination}/${entry.fileName}`
              );
              processedFiles += 1;
              this.emitProgress(onFileProgress, { importId, processedFiles });
              next();
            } catch (storeErr) {
              reject(storeErr);
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

    return {
      sourceType: 'zip',
      extractedFilesCount: processedFiles,
      totalFilesInZip: files.length,
      files,
    };
  }
}

export type { NormalizeResult, NormalizedSourceFile };
