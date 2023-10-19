import readline from 'readline';

import csvtojson from 'csvtojson';

import { Readable } from 'stream';

type CSVRow = { [k: string]: string };

const DELIMITERS = [',', ';'];
const DELIMITER_REGEX = new RegExp(`[${DELIMITERS.join('')}]`);

const peekHeaders = async (readStream: Readable): Promise<string[]> => {
  let headers: string[] = [];
  const rl = readline.createInterface({ input: readStream });
  const line = (await rl[Symbol.asyncIterator]().next()).value;
  headers = line.split(DELIMITER_REGEX);
  rl.close();
  readStream.unpipe();
  readStream.destroy();
  return headers;
};

class ValidateFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidateFormatError';
  }
}

type ValidateFormatOptions = {
  column_number?: number;
  required_headers?: string[];
  no_empty_values?: boolean;
};

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
    return csvtojson({ delimiter: DELIMITERS })
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

const validateFormat = async (readStream: Readable, options: ValidateFormatOptions) => {
  const anyOption = Object.keys(options).length > 0;
  const headerOptions = options.required_headers || options.column_number;

  if (!anyOption) {
    return;
  }

  const csvObj = csv(readStream, true);

  csvObj.onRow(async (row: CSVRow, index: number) => {
    if (headerOptions && index === 0) {
      const headers = Object.keys(row);
      if (options.column_number) {
        if (headers.length !== options.column_number) {
          throw new ValidateFormatError(
            `Expected ${options.column_number} columns, but found ${headers.length}.`
          );
        }
      }

      if (options.required_headers) {
        const headerSet = new Set(headers);
        const missingHeaders = options.required_headers.filter(header => !headerSet.has(header));
        if (missingHeaders.length) {
          throw new ValidateFormatError(`Missing required headers: ${missingHeaders.join(', ')}.`);
        }
      }

      if (!options.no_empty_values) {
        csvObj.reading = false;
      }
    }

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

export default csv;
export type { CSVRow, ValidateFormatOptions };
export { peekHeaders, validateFormat, ValidateFormatError };
