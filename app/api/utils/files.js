import fs from 'fs';
import path from 'path';

import ID from 'shared/uniqueID';
import configPaths from '../config/paths';

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

const deleteUploadedFile = filename =>
  deleteFile(path.join(configPaths.uploadDocumentsPath, filename));

const generateFileName = file =>
  Date.now() + ID() + path.extname(file.originalname);

export { deleteUploadedFile, deleteFiles, deleteFile, generateFileName };
