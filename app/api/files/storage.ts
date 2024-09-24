import { NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { NodeHttpHandler } from '@smithy/node-http-handler';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { access, readdir } from 'fs/promises';
import path from 'path';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { FileNotFound } from './FileNotFound';
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
    s3Instance = new S3Storage(
      new S3Client({
        requestHandler: new NodeHttpHandler({
          socketTimeout: 30000,
        }),
        apiVersion: 'latest',
        region: 'placeholder-region',
        endpoint: config.s3.endpoint,
        credentials: config.s3.credentials,
        forcePathStyle: true,
      })
    );
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

const catchFileNotFound = async <T>(cb: () => Promise<T>, filename: string): Promise<T> => {
  const storageType = tenants.current().featureFlags?.s3Storage ? 's3' : 'local';
  try {
    return await cb();
  } catch (err) {
    if (err?.code === 'ENOENT' || err instanceof NoSuchKey) {
      throw new FileNotFound(filename, storageType);
    }
    throw err;
  }
};

export const storage = {
  async readableFile(filename: string, type: FileTypes) {
    return catchFileNotFound(async () => {
      if (tenants.current().featureFlags?.s3Storage) {
        return readFromS3(filename, type);
      }
      return createReadStream(paths[type](filename));
    }, filename);
  },
  async fileContents(filename: string, type: FileTypes) {
    return catchFileNotFound(
      async () => streamToBuffer(await this.readableFile(filename, type)),
      filename
    );
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

  async listFiles() {
    if (tenants.current().featureFlags?.s3Storage) {
      const results = await s3().list(tenants.current().name);
      return results.map(c => c.Key!);
    }

    const files: string[] = [];
    const uniquePaths = new Set(Object.values(paths).map(pathFn => pathFn('')));
    await Array.from(uniquePaths).reduce(async (prev, filesPath) => {
      await prev;
      try {
        (await readdir(filesPath, { withFileTypes: true })).forEach(file => {
          if (file.isFile()) {
            files.push(path.join(filesPath, file.name));
          }
        });
      } catch (err) {
        if (err?.code === 'ENOENT') {
          return;
        }

        throw err;
      }
    }, Promise.resolve());
    return files;
  },

  async createDirectory(dirPath: string) {
    if (!tenants.current().featureFlags?.s3Storage) {
      await createDirIfNotExists(dirPath);
    }
  },

  getPath(filename: string, type: FileTypes) {
    if (tenants.current().featureFlags?.s3Storage) {
      return s3KeyWithPath(filename, type);
    }

    return paths[type](filename);
  },
};
