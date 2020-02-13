import yauzl from 'yauzl';
import { streamToString } from '../files/filesystem';

export default function(zipFile) {
  return {
    async getFileContent(matchFile) {
      const stream = await this.findReadStream(matchFile);
      if (stream) {
        return streamToString(stream);
      }
      return null;
    },

    findReadStream(matchFile) {
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
                // reject(new Error('file not found in zip'));
                resolve(null);
              }
            });
            zipfile.on('entry', entry => {
              if (matchFile(entry)) {
                found = true;
                zipfile.openReadStream(entry, (error, readStream) => {
                  if (error) reject(error);
                  resolve(readStream);
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
