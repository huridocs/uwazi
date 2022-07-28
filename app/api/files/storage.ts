// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { FileType } from 'shared/types/fileType';
import { access } from 'fs/promises';
import { Readable } from 'stream';
import { attachmentsPath, customUploadsPath, uploadsPath } from './filesystem';
import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fs } from '.';

type FileTypes = NonNullable<FileType['type']>;

const s3 = new S3Client({
  apiVersion: 'latest',
  region: 'uwazi-development',
  endpoint: 'http://192.168.1.223:9000',
  credentials: {
    accessKeyId: 'YTmqw9gKSqfRDjFC',
    secretAccessKey: 'OUHB77FxYB2DUCmmsfi8ZeUK6juClJru',
  },
  forcePathStyle: true, // needed for minio
});

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
  try {
    await s3.send(
      new GetObjectCommand({
        Bucket: 'uwazi-development',
        Key: filename,
      })
    );
  } catch (e: unknown) {
    if (e instanceof NoSuchKey) {
      await s3.send(
        new PutObjectCommand({
          Bucket: 'uwazi-development',
          Key: filename,
          Body: await fs.readFile(paths[type](filename)),
        })
      );
    } else {
      throw e;
    }
  }

  return createReadStream(paths[type](filename));
};

export const fileContents = async (filename: string, type: FileTypes) => {
  return streamToBuffer(await readableFile(filename, type));
};

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
