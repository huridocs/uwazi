import path from 'path';
import { Readable } from 'stream';

import ID from 'shared/uniqueID';
import { tenants } from 'api/tenants/tenantContext';
import { testingTenants } from 'api/utils/testingTenants';

import { uwaziFS as fs } from './uwaziFS';
import { FileType } from '../../shared/types/fileType';

type FilePath = string;
type pathFunction = (fileName?: string) => FilePath;

const uploadsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().uploadedDocuments, fileName);

const attachmentsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().attachments, fileName);

const customUploadsPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().customUploads, fileName);

const temporalFilesPath: pathFunction = (fileName = ''): FilePath =>
  path.join(tenants.current().temporalFiles, fileName);

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
    temporalFiles: `${__dirname}/specs/uploads/${subPath}`,
    activityLogs: `${__dirname}/specs/uploads/${subPath}`,
  };
};

const setupTestUploadedPaths = async (subFolder: string = '') => {
  testingTenants.changeCurrentTenant(await testingUploadPaths(subFolder));
};

const deleteUploadedFiles = async (files: FileType[]) =>
  deleteFiles(
    files
      .filter(f => f.filename)
      .map(({ filename = '', type }) => {
        if (type === 'custom') {
          return customUploadsPath(filename);
        }
        return uploadsPath(filename);
      })
  );

const fileExists = async (filePath: FilePath): Promise<boolean> => {
  try {
    await fs.access(filePath);
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
    const writeStream = fs.createWriteStream(filePath);
    readStream
      .pipe(writeStream)
      .on('finish', () => resolve(filePath))
      .on('error', reject);
  });

const streamToString = async (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const getFileContent = async (fileName: FilePath): Promise<string> =>
  fs.readFile(uploadsPath(fileName), 'utf8');

const readFile = async (fileName: FilePath): Promise<Buffer> => fs.readFile(fileName);

const storeFile: (
  filePathFunction: pathFunction,
  file: any,
  overrideFilename: boolean
) => Promise<FileType> = async (filePathFunction, file, overrideFilename = false) => {
  const filename = (overrideFilename && file.filename) || generateFileName(file);
  await fs.appendFile(filePathFunction(filename), file.buffer);
  return Object.assign(file, { filename, destination: filePathFunction() });
};

export {
  setupTestUploadedPaths,
  deleteUploadedFiles,
  createDirIfNotExists,
  deleteFiles,
  deleteFile,
  generateFileName,
  fileFromReadStream,
  fileExists,
  streamToString,
  getFileContent,
  customUploadsPath,
  uploadsPath,
  temporalFilesPath,
  attachmentsPath,
  activityLogPath,
  readFile,
  storeFile,
  testingUploadPaths,
};

export type { FilePath, pathFunction };
