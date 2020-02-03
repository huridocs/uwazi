/** @format */

import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import ID from 'shared/uniqueID';
import asyncFS from 'api/utils/async-fs';

import configPaths from '../config/paths';

export type FilePath = string;
export type File = Express.Multer.File;

function deleteFile(file: FilePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, err => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      }
      resolve();
    });
  });
}

function deleteFiles(files: FilePath[]) {
  return Promise.all(files.map(file => deleteFile(file)));
}

const uploadsPath = (fileName: FilePath): FilePath =>
  path.join(configPaths.uploadedDocuments, fileName);

const deleteUploadedFile = (fileName: FilePath) => deleteFile(uploadsPath(fileName));

const generateFileName = (file: File) => Date.now() + ID() + path.extname(file.originalname);

const fileFromReadStream = (fileName: FilePath, readStream: Readable): Promise<FilePath> =>
  new Promise((resolve, reject) => {
    const filePath = uploadsPath(fileName);
    const writeStream = fs.createWriteStream(filePath);
    readStream
      .pipe(writeStream)
      .on('finish', () => resolve(filePath))
      .on('error', reject);
  });

const streamToString = (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const getFileContent = (fileName: FilePath): Promise<string> =>
  asyncFS.readFile(uploadsPath(fileName), 'utf8');

export {
  deleteUploadedFile,
  deleteFiles,
  deleteFile,
  generateFileName,
  fileFromReadStream,
  streamToString,
  getFileContent,
  uploadsPath,
};
