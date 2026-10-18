import csvtojson from 'csvtojson';
import { Readable } from 'stream';
import readline from 'readline';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { CsvReaderError, missingCsvHeaderError } from './CsvReaderError.js';

type CsvReaderOptions = {
  delimiters?: string[];
};

type CsvReaderCallbacks = {
  onHeaders?: (headers: string[]) => Promise<void> | void;
  onRow: (row: { index: number; values: string[] }) => Promise<void> | void;
};

const DEFAULT_DELIMITERS = [',', ';'];
const BOM = '\ufeff';
const UNREADABLE_CSV_MESSAGE =
  'The CSV could not be read. Check that the file is valid CSV and upload it again.';

const spreadsheetRow = (line: number) => line + 2;

const unclosedQuoteMessage = (line: number) =>
  `The CSV could not be read because a quoted value was not closed (row ${spreadsheetRow(line)}). Close the quote and upload the file again.`;

const columnMismatchMessage = (line: number) =>
  `The CSV could not be read because a row does not have the same number of columns as the header (row ${spreadsheetRow(line)}).`;

const parserDetails = (error: Error) => {
  const candidate = error as Error & { err?: unknown; line?: unknown };
  return {
    err: typeof candidate.err === 'string' ? candidate.err : undefined,
    line: typeof candidate.line === 'number' ? candidate.line : undefined,
  };
};

const fromParserError = (error: Error) => {
  const { err, line } = parserDetails(error);
  if (err === 'unclosed_quote' && line !== undefined) {
    return new CsvReaderError(unclosedQuoteMessage(line), { reason: 'UnclosedQuote', line });
  }
  if (err === 'column_mismatched' && line !== undefined) {
    return new CsvReaderError(columnMismatchMessage(line), { reason: 'ColumnMismatch', line });
  }
  return new CsvReaderError(UNREADABLE_CSV_MESSAGE, { reason: 'CsvUnreadable', line });
};

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
              throw missingCsvHeaderError();
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
          safeReject(fromParserError(error));
        },
        () => safeResolve()
      );
    });

    if (!headers) {
      throw missingCsvHeaderError();
    }
  }
}
