import yauzl from 'yauzl';

export default function (zipFile) {
  return {
    findReadStream(matchFile) {
      let found = false;
      return new Promise((resolve, reject) => {
        yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
          if (err) {
            return reject(err);
          }
          zipfile.readEntry();
          zipfile.on('end', () => {
            if (!found) {
              reject(new Error('file not found in zip'));
            }
          });
          zipfile.on('entry', (entry) => {
            // if (/\/$/.test(entry.fileName)) {
            //   zipfile.readEntry();
            // } else {
            if (matchFile(entry)) {
              found = true;
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) reject(err);
                resolve(readStream);
              });
              zipfile.close();
              return
            }
            zipfile.readEntry();
            // }
          });
        });
      });
    }
  };
}
