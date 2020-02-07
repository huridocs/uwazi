import fs from 'fs';
import path from 'path';

import ID from 'shared/uniqueID';
import asyncFS from 'api/utils/async-fs';

import configPaths from '../config/paths';

function deleteFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, err => {
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
  deleteFile(path.join(configPaths.uploadedDocuments, filename));

const generateFileName = file => Date.now() + ID() + path.extname(file.originalname);

const fileFromReadStream = (fileName, readStream) =>
  new Promise((resolve, reject) => {
    const filePath = path.join(configPaths.uploadedDocuments, fileName);
    const writeStream = fs.createWriteStream(filePath);
    readStream
      .pipe(writeStream)
      .on('finish', () => resolve(filePath))
      .on('error', reject);
  });

const streamToString = stream => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

const getFileContent = fileName => {
  const filePath = path.join(configPaths.uploadedDocuments, fileName);
  return asyncFS.readFile(filePath, 'utf8');
};

export {
  deleteUploadedFile,
  deleteFiles,
  deleteFile,
  generateFileName,
  fileFromReadStream,
  streamToString,
  getFileContent,
};
