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

export default csv;
export type { CSVRow };
export { peekHeaders };
