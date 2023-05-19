import { NoSuchKey } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { access } from 'fs/promises';
import path from 'path';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import {
  activityLogPath,
  attachmentsPath,
  createDirIfNotExists,
  customUploadsPath,
  deleteFile,
  uploadsPath,
} from './filesystem';
import { S3Storage } from './S3Storage';

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

const s3KeyWithPath = (filename: string, type: FileTypes) => {
  const sliceValue = type === 'segmentation' ? -3 : -2;
  return path.join(
    tenants.current().name,
    paths[type](filename).split('/').slice(sliceValue).join('/')
  );
};

const readFromS3 = async (filename: string, type: FileTypes): Promise<Readable> => {
  const response = await s3().get(s3KeyWithPath(filename, type));
  return response.Body as Readable;
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
    if (tenants.current().featureFlags?.s3Storage) {
      return s3().delete(s3KeyWithPath(filename, type));
    }

    return deleteFile(paths[type](filename));
  },
  async storeFile(filename: string, file: Readable, type: FileTypes) {
    if (tenants.current().featureFlags?.s3Storage) {
      return s3().upload(s3KeyWithPath(filename, type), await streamToBuffer(file));
    }

    return pipeline(file, createWriteStream(paths[type](filename)));
  },

  async fileExists(filename: string, type: FileTypes): Promise<boolean> {
    try {
      if (tenants.current().featureFlags?.s3Storage) {
        (await readFromS3(filename, type)).destroy();
      } else {
        await access(paths[type](filename));
      }
    } catch (err) {
      if (err?.code === 'ENOENT' || err instanceof NoSuchKey) {
        return false;
      }
      if (err) {
        throw err;
      }
    }

    return true;
  },

  async createDirectory(dirPath: string) {
    if (!tenants.current().featureFlags?.s3Storage) {
      await createDirIfNotExists(dirPath);
    }
  },
};
