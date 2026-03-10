import yauzl from 'yauzl';
import { Readable } from 'stream';
import { streamToString } from '../files/filesystem';

export type matchCB = (entry: string) => boolean;

export default function (zipFile: string) {
  return {
    async getFileContent(matchFile: matchCB) {
      const stream = await this.findReadStream(matchFile);
      if (stream) {
        return streamToString(stream);
      }
      return null;
    },

    async findReadStream(matchFile: matchCB): Promise<Readable | null> {
      let found = false;
      return new Promise((resolve, reject) => {
        yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
          if (err) {
            reject(err);
          }
          if (zipfile) {
            zipfile.readEntry();
            zipfile.on('end', () => {
              if (!found) {
                resolve(null);
              }
            });
            zipfile.on('entry', entry => {
              if (matchFile(entry.fileName)) {
                found = true;
                zipfile.openReadStream(entry, (error, readStream) => {
                  if (error) reject(error);
                  resolve(readStream || null);
                });
                zipfile.close();
                return;
              }
              zipfile.readEntry();
            });
          }
        });
      });
    },
  };
}
