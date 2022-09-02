import { NoSuchKey } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { errorLog } from 'api/log';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { access, readFile } from 'fs/promises';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import {
  activityLogPath,
  attachmentsPath,
  customUploadsPath,
  deleteFile,
  uploadsPath,
} from './filesystem';
import { S3Storage } from './S3Storage';
import { pipeline } from 'stream/promises';

type FileTypes = NonNullable<FileType['type']> | 'activitylog' | 'segmentation';

let s3Instance: S3Storage;
const s3 = () => {
  if (config.s3.endpoint && !s3Instance) {
    s3Instance = new S3Storage();
  }
  return s3Instance;
};

const paths: { [k in FileTypes]: (filename: string) => string } = {
  custom: customUploadsPath,
  document: uploadsPath,
  segmentation: filename => uploadsPath(`segmentation/${filename}`),
  thumbnail: uploadsPath,
  attachment: attachmentsPath,
  activitylog: activityLogPath,
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const _buf: Buffer[] = [];
    stream.on('data', (chunk: any) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err: unknown) => reject(err));
  });

const s3KeyWithPath = (filename: string, type: FileTypes) =>
  paths[type](filename).split('/').slice(-2).join('/');

const readFromS3 = async (filename: string, type: FileTypes): Promise<Readable> => {
  try {
    const response = await s3().get(s3KeyWithPath(filename, type));
    return response.Body as Readable;
  } catch (e: unknown) {
    if (e instanceof NoSuchKey) {
      const start = Date.now();
      s3()
        .upload(s3KeyWithPath(filename, type), await readFile(paths[type](filename)))
        .then(() => {
          const finish = Date.now();
          errorLog.debug(
            `File "${filename}" uploaded to S3 in ${(finish - start) / 1000} for tenant ${
              tenants.current().name
            }`
          );
        })
        .catch(error => {
          errorLog.error(
            `File "${filename}" Failed to be uploaded to S3 with error: ${
              error.message
            } for tenant ${tenants.current().name}`
          );
        });

      return createReadStream(paths[type](filename));
    }
    throw e;
  }
};

export const storage = {
  async readableFile(filename: string, type: FileTypes) {
    if (tenants.current().featureFlags?.s3Storage) {
      return readFromS3(filename, type);
    }
    return createReadStream(paths[type](filename));
  },
  async fileContents(filename: string, type: FileTypes) {
    return streamToBuffer(await this.readableFile(filename, type));
  },
  async removeFile(filename: string, type: FileTypes) {
    await deleteFile(paths[type](filename));
    if (tenants.current().featureFlags?.s3Storage) {
      await s3().delete(s3KeyWithPath(filename, type));
    }
  },
  async storeFile(filename: string, file: Readable, type: FileTypes) {
    await pipeline(file, createWriteStream(paths[type](filename)));

    if (tenants.current().featureFlags?.s3Storage) {
      await s3().upload(
        s3KeyWithPath(filename, type),
        await streamToBuffer(createReadStream(paths[type](filename)))
      );
    }
  },
  async fileExists(filename: string, type: FileTypes): Promise<boolean> {
    try {
      await access(paths[type](filename));
    } catch (err) {
      if (err?.code === 'ENOENT') {
        return false;
      }
      if (err) {
        throw err;
      }
    }
    return true;
  },
};
