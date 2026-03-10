import csvtojson from 'csvtojson';

import { Readable } from 'stream';
import importFile, { ImportFile } from './importFile';

type CSVRow = { [k: string]: string };

const DELIMITERS = [',', ';'];

const peekHeaders = async (readSource: Readable | string): Promise<string[]> => {
  const readStream =
    typeof readSource === 'string' ? await importFile(readSource).readStream() : readSource;
  let headers: string[] = [];
  await csvtojson()
    .fromStream(readStream)
    .on('header', async h => {
      headers = h;
    });

  return headers;
};

class ValidateFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidateFormatError';
  }
}

type ValidateHeaderOptions = {
  column_number?: number;
  required_headers?: string[];
};

type ValidateCSVBodyOptions = {
  no_empty_values?: boolean;
};

type ValidateFormatOptions = ValidateHeaderOptions & ValidateCSVBodyOptions;

const csv = (readStream: Readable, stopOnError = false) => ({
  reading: false,
  onRowCallback: async (_row: CSVRow, _index: number) => {},
  onErrorCallback: async (_error: Error, _row: CSVRow, _index: number) => {},

  onRow(onRowCallback: (_row: CSVRow, _index: number) => Promise<void>) {
    this.onRowCallback = onRowCallback;
    return this;
  },

  onError(onErrorCallback: (_error: Error, _row: CSVRow, _index: number) => Promise<void>) {
    this.onErrorCallback = onErrorCallback;
    return this;
  },

  async read() {
    this.reading = true;
    return csvtojson({ delimiter: DELIMITERS, flatKeys: true })
      .fromStream(readStream)
      .subscribe(async (row: CSVRow, index) => {
        if (!this.reading) {
          return;
        }
        try {
          await this.onRowCallback(row, index);
        } catch (e) {
          await this.onErrorCallback(e, row, index);
          if (stopOnError) {
            this.reading = false;
            readStream.unpipe();
            readStream.destroy();
          }
        }
      });
  },
});

const validateHeader = async (file: ImportFile, options: ValidateHeaderOptions) => {
  const headerOptions = options.required_headers || options.column_number;
  if (!headerOptions) return;

  const header = await peekHeaders(await file.readStream());

  if (options.column_number) {
    if (header.length !== options.column_number) {
      throw new ValidateFormatError(
        `Expected ${options.column_number} columns, but found ${header.length}.`
      );
    }
  }

  if (options.required_headers) {
    const headerSet = new Set(header);
    const missingHeaders = options.required_headers.filter(name => !headerSet.has(name));
    if (missingHeaders.length) {
      throw new ValidateFormatError(`Missing required headers: ${missingHeaders.join(', ')}.`);
    }
  }
};

const validateCSVBody = async (file: ImportFile, options: ValidateCSVBodyOptions) => {
  const bodyOptions = options.no_empty_values;
  if (!bodyOptions) return;

  const readStream = await file.readStream();
  const csvObj = csv(readStream, true);

  csvObj.onRow(async (row: CSVRow, index: number) => {
    if (options.no_empty_values) {
      Object.entries(row).forEach(([header, value]) => {
        if (!value) {
          throw new ValidateFormatError(`Empty value at row ${index + 1}, column "${header}".`);
        }
      });
    }
  });

  csvObj.onError(async (e: Error) => {
    throw e;
  });

  await csvObj.read();
};

const validateFormat = async (filePath: string, options: ValidateFormatOptions) => {
  const file = importFile(filePath);
  await validateHeader(file, options);
  await validateCSVBody(file, options);
};

export default csv;
export type { CSVRow, ValidateFormatOptions };
export { peekHeaders, validateFormat, ValidateFormatError };
