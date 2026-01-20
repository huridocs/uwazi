import csvtojson from 'csvtojson';
import { Readable } from 'stream';
import readline from 'readline';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { CsvReaderError } from '#api/csv.v2/application/services/CsvReaderError.js';

type CsvReaderOptions = {
  delimiters?: string[];
};

type CsvReaderCallbacks = {
  onHeaders?: (headers: string[]) => Promise<void> | void;
  onRow: (row: { index: number; values: string[] }) => Promise<void> | void;
};

const DEFAULT_DELIMITERS = [',', ';'];
const BOM = '\ufeff';

export class CsvReader {
  private static toReadableStream(file: FileContents) {
    return Readable.from(
      (async function* streamFile() {
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of file.read()) {
          yield Buffer.from(chunk);
        }
      })()
    );
  }

  static async collectEmptyRowIndexes(file: FileContents) {
    const lineReader = CsvReader.toReadableStream(file);
    return new Promise<number[]>((resolve, reject) => {
      const candidateIndexes: number[] = [];
      let dataIndex = -1;
      let isHeader = true;
      let lastNonEmptyIndex = -1;
      const rl = readline.createInterface({
        input: lineReader,
        crlfDelay: Infinity,
      });
      rl.on('line', (line: string) => {
        if (isHeader) {
          isHeader = false;
          return;
        }
        dataIndex += 1;
        if (!line.trim()) {
          candidateIndexes.push(dataIndex);
          return;
        }
        lastNonEmptyIndex = dataIndex;
      });
      rl.on('close', () => {
        const filtered = candidateIndexes.filter(index => index <= lastNonEmptyIndex);
        resolve(filtered);
      });
      rl.on('error', reject);
    });
  }

  private static sanitizeHeaders(headers: string[]) {
    if (!headers.length) {
      return headers;
    }
    const sanitized = [...headers];
    sanitized[0] = sanitized[0].startsWith(BOM) ? sanitized[0].slice(1) : sanitized[0];
    return sanitized;
  }

  static async stream(
    file: FileContents,
    callbacks: CsvReaderCallbacks,
    options?: CsvReaderOptions
  ) {
    const delimiters = options?.delimiters ?? DEFAULT_DELIMITERS;
    const readable = this.toReadableStream(file);
    const converter = csvtojson({
      delimiter: delimiters,
      trim: false,
      checkType: false,
      flatKeys: true,
      ignoreEmpty: false,
    });

    let headers: string[] | null = null;
    let headersReady: Promise<void> = Promise.resolve();

    converter.on('header', headerList => {
      headers = this.sanitizeHeaders(headerList);
      headersReady = Promise.resolve(callbacks.onHeaders?.(headers)).then(() => undefined);
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const safeReject = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        readable.destroy(error);
        reject(error);
      };
      const safeResolve = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };

      converter.fromStream(readable).subscribe(
        async (row: Record<string, string>, index: number) => {
          try {
            if (!headers) {
              throw new CsvReaderError('CSV header row missing.');
            }
            await headersReady;
            const values = headers.map(header => (row[header] ?? '').toString());
            await callbacks.onRow({ index, values });
          } catch (error) {
            safeReject(error as Error);
          }
        },
        (error: Error) => {
          if (error instanceof CsvReaderError) {
            safeReject(error);
            return;
          }
          safeReject(new CsvReaderError(error.message || 'Failed to parse CSV content.'));
        },
        () => safeResolve()
      );
    });

    if (!headers) {
      throw new CsvReaderError('CSV file must contain headers.');
    }
  }
}
