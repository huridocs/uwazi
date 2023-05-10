import path from 'path';
import { Readable } from 'stream';

import ID from 'shared/uniqueID';
// eslint-disable-next-line node/no-restricted-import
import fs, { access } from 'fs/promises';
import { tenants } from 'api/tenants/tenantContext';
import { testingTenants } from 'api/utils/testingTenants';

import { FileType } from '../../shared/types/fileType';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';

type FilePath = string;
type pathFunction = (fileName?: string) => FilePath;

const uploadsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().uploadedDocuments, fileName);

const attachmentsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().attachments, fileName);

const customUploadsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().customUploads, fileName);

const temporalFilesPath: pathFunction = (fileName = ''): FilePath => path.join('/tmp', fileName);

const activityLogPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().activityLogs, fileName);

async function deleteFile(file: FilePath) {
  try {
    await fs.unlink(file);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
}

async function deleteFiles(files: FilePath[]) {
  return Promise.all(files.map(async file => deleteFile(file)));
}

const createDirIfNotExists = async (dirPath: string) => {
  try {
    await fs.mkdir(dirPath);
  } catch (e) {
    if (!e.message.match(/file already exists/)) {
      throw e;
    }
  }
};

const testingUploadPaths = async (subPath: string = '') => {
  if (subPath) {
    await createDirIfNotExists(`${__dirname}/specs/uploads/${subPath}`);
    await createDirIfNotExists(`${__dirname}/specs/customUploads/${subPath}`);
  }
  return {
    uploadedDocuments: `${__dirname}/specs/uploads/${subPath}`,
    attachments: `${__dirname}/specs/uploads/${subPath}`,
    customUploads: `${__dirname}/specs/customUploads/${subPath}`,
    activityLogs: `${__dirname}/specs/uploads/${subPath}`,
  };
};

const setupTestUploadedPaths = async (subFolder: string = '') => {
  testingTenants.changeCurrentTenant(await testingUploadPaths(subFolder));
};

const generateFileName = ({ originalname = '' }: FileType) =>
  Date.now() + ID() + path.extname(originalname);

/**
 * Create a file from a read stream and save it to one of uwazi filesystem paths
 * @param destination by default this will be uploadsPaths,
 * if you want another one you can pass filesystem destinatations
 * e.g. attachmentsPath()
 *
 */
const fileFromReadStream = async (
  fileName: FilePath,
  readStream: Readable | NodeJS.ReadableStream,
  destination: string | undefined = undefined
): Promise<FilePath> =>
  new Promise((resolve, reject) => {
    const filePath = path.join(destination || uploadsPath(), fileName);
    const writeStream = createWriteStream(filePath);
    readStream
      .pipe(writeStream)
      .on('finish', () => resolve(filePath))
      .on('error', reject);
  });

const streamToString = async (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const fileExistsOnPath = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return false;
    }
    if (err) {
      throw err;
    }
  }
  return true;
};

export {
  setupTestUploadedPaths,
  createDirIfNotExists,
  deleteFiles,
  deleteFile,
  generateFileName,
  fileFromReadStream,
  streamToString,
  customUploadsPath,
  uploadsPath,
  temporalFilesPath,
  attachmentsPath,
  activityLogPath,
  testingUploadPaths,
  fileExistsOnPath,
};

export type { FilePath, pathFunction };
