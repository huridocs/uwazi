import fs from 'fs';
import path from 'path';

import ID from 'shared/uniqueID';

function deleteFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      }
      resolve();
    });
  });
}

function deleteFiles(files) {
  return Promise.all(files.map(file => deleteFile(file)));
}

const generateFileName = file =>
  Date.now() + ID() + path.extname(file.originalname);

export { deleteFiles, deleteFile, generateFileName };
