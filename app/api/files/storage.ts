import { NoSuchKey, NotFound, S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler, NodeHttpHandlerOptions } from '@smithy/node-http-handler';
import { inspect } from 'util';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { access, readdir } from 'fs/promises';
import path from 'path';

import { config } from 'api/config';
import { legacyLogger } from 'api/log';
import { tenants } from 'api/tenants';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { FileNotFound } from './FileNotFound';
import {
  activityLogPath,
  attachmentsPath,
  createDirIfNotExists,
  customUploadsPath,
  deleteFile,
  uploadsPath,
} from './filesystem';
import { S3Error, S3Storage } from './S3Storage';

let s3Instance: S3Storage;

const buildS3Client = (params: {}) => {
  const client = new S3Client({
    maxAttempts: 5,
    requestHandler: new NodeHttpHandler(params),
    apiVersion: 'latest',
    region: 'placeholder-region',
    endpoint: config.s3.endpoint,
    credentials: config.s3.credentials,
    forcePathStyle: true,
  });

  // eslint-disable-next-line max-statements
  client.middlewareStack.add((next, context) => async args => {
    const startTime = Date.now();

    const input = args.input as { Body?: Buffer; Key?: string };

    try {
      const result = await next(args);
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV !== 'test') {
        LoggerFactory.default().info('S3 operation completed', {
          operation: context.commandName,
          duration,
          key: input.Key,
          fileSizeKB: Buffer.isBuffer(input.Body) ? input.Body.length / 1024 : NaN,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        LoggerFactory.default().info('S3 operation failed', {
          operation: context.commandName,
          duration: Date.now() - startTime,
          key: input.Key,
          fileSizeKB: Buffer.isBuffer(input.Body) ? input.Body.length / 1024 : NaN,
          success: false,
          error: error.message,
          errorCode: error.$metadata?.httpStatusCode,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  });
  return client;
};
const s3 = () => {
  const params: NodeHttpHandlerOptions = {
    socketTimeout: 30000,
    connectionTimeout: 3000,
    httpAgent: {
      maxSockets: 500,
      timeout: 60000,
      maxFreeSockets: 100,
      keepAlive: true,
      keepAliveMsecs: 5000,
    },
    httpsAgent: {
      maxSockets: 500,
      timeout: 60000,
      maxFreeSockets: 100,
      keepAlive: true,
      keepAliveMsecs: 5000,
    },
  };

  if (config.s3.endpoint && !s3Instance) {
    s3Instance = new S3Storage(buildS3Client(params));
  }

  return s3Instance;
};

type FileTypes = NonNullable<FileType['type']> | 'activitylog' | 'segmentation';

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
    if (
      err?.code === 'ENOENT' ||
      (err instanceof S3Error && err.originalError instanceof NoSuchKey)
    ) {
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
        await s3().head(s3KeyWithPath(filename, type));
      } else {
        await access(paths[type](filename));
      }
    } catch (err) {
      if (
        err?.code === 'ENOENT' ||
        (err instanceof S3Error && err.originalError instanceof NotFound)
      ) {
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

  async storeMultipleFiles(files: { filename: string; file: Readable; type: FileTypes }[]) {
    const uploadedFiles: { filename: string; type: FileTypes }[] = [];

    try {
      await files.reduce(async (promise, { filename, file, type }) => {
        await promise;
        await this.storeFile(filename, file, type);
        uploadedFiles.push({ filename, type });
      }, Promise.resolve());
    } catch (error) {
      await Promise.all(
        uploadedFiles.map(async ({ filename, type }) => {
          try {
            await this.removeFile(filename, type);
          } catch (rollbackError) {
            legacyLogger.error(
              inspect(new Error('Failed to rollback file', { cause: rollbackError }))
            );
          }
        })
      );
      throw error;
    }
  },
};

export { paths, s3KeyWithPath };
export type { FileTypes };
