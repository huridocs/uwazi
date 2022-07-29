// eslint-disable-next-line node/no-restricted-import
import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { createReadStream } from 'fs';
import { access, readFile } from 'fs/promises';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { attachmentsPath, customUploadsPath, uploadsPath } from './filesystem';

type FileTypes = NonNullable<FileType['type']>;

let s3ClientInstance: S3Client;
const s3instance = () => {
  if (config.s3.endpoint && !s3ClientInstance) {
    s3ClientInstance = new S3Client({
      apiVersion: 'latest',
      region: 'uwazi-development',
      endpoint: config.s3.endpoint,
      credentials: config.s3.credentials,
      forcePathStyle: true, // needed for minio
    });
  }
  return s3ClientInstance;
};

const paths: { [k in FileTypes]: (filename: string) => string } = {
  custom: customUploadsPath,
  document: uploadsPath,
  thumbnail: uploadsPath,
  attachment: attachmentsPath,
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const _buf: Buffer[] = [];
    stream.on('data', (chunk: any) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err: unknown) => reject(err));
  });

export const readableFile = async (filename: string, type: FileTypes) => {
  if (tenants.current().featureFlags?.s3Storage) {
    const s3 = s3instance();
    try {
      await s3.send(
        new GetObjectCommand({
          Bucket: tenants.current().name.replace('_', '-'),
          Key: filename,
        })
      );
    } catch (e: unknown) {
      if (e instanceof NoSuchKey) {
        await s3.send(
          new PutObjectCommand({
            Bucket: tenants.current().name.replace('_', '-'),
            Key: filename,
            Body: await readFile(paths[type](filename)),
          })
        );
      } else {
        throw e;
      }
    }
  }

  return createReadStream(paths[type](filename));
};

export const fileContents = async (filename: string, type: FileTypes) =>
  streamToBuffer(await readableFile(filename, type));

export const fileExists = async (filename: string, type: FileTypes): Promise<boolean> => {
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
};
