import yauzl from 'yauzl';

export default function (zipFile) {
  return {
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
                reject(new Error('file not found in zip'));
              }
            });
            zipfile.on('entry', (entry) => {
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
    }
  };
}
