// eslint-disable-next-line node/no-restricted-import
import { stat } from 'fs/promises';
import path from 'path';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Db } from 'mongodb';
import { config } from 'api/config';
import { FileDocument, MigrationStorageFileType, TenantSnapshot } from './types';

const defaultTenantSnapshot = (): TenantSnapshot => config.defaultTenant;

const uploadsPath = (tenant: TenantSnapshot, fileName = ''): string =>
  path.join(tenant.uploadedDocuments, fileName);

const attachmentsPath = (tenant: TenantSnapshot, fileName = ''): string =>
  path.join(tenant.attachments, fileName);

const customUploadsPath = (tenant: TenantSnapshot, fileName = ''): string =>
  path.join(tenant.customUploads, fileName);

const paths = (tenant: TenantSnapshot) => ({
  custom: (filename: string) => customUploadsPath(tenant, filename),
  document: (filename: string) => uploadsPath(tenant, filename),
  segmentation: (filename: string) => uploadsPath(tenant, `segmentation/${filename}`),
  thumbnail: (filename: string) => uploadsPath(tenant, filename),
  attachment: (filename: string) => attachmentsPath(tenant, filename),
  activitylog: (filename: string) => path.join(tenant.uploadedDocuments, filename),
});

const s3Config = config.s3;

const buildS3Client = () => {
  const client = new S3Client({
    maxAttempts: 5,
    requestHandler: new NodeHttpHandler({
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
    }),
    apiVersion: 'latest',
    region: 'placeholder-region',
    endpoint: s3Config.endpoint,
    credentials: s3Config.credentials,
    forcePathStyle: true,
  });

  return client;
};

const getTypeForFile = (file: FileDocument): MigrationStorageFileType => file.type || 'document';

const s3KeyWithPath = (
  filename: string,
  type: MigrationStorageFileType,
  tenant: TenantSnapshot
) => {
  const sliceValue = type === 'segmentation' ? -3 : -2;
  return path.join(
    tenant.name,
    paths(tenant)[type](filename).split('/').slice(sliceValue).join('/')
  );
};

const localPathForFile = (file: FileDocument, tenant: TenantSnapshot) => {
  if (!file.filename) {
    return undefined;
  }

  return paths(tenant)[getTypeForFile(file)](file.filename);
};

const getS3Size = async (s3: S3Client, file: FileDocument, tenant: TenantSnapshot) => {
  if (!file.filename) {
    return undefined;
  }

  try {
    const response = await s3.send(
      new HeadObjectCommand({
        Bucket: s3Config.bucket,
        Key: s3KeyWithPath(file.filename, getTypeForFile(file), tenant),
      })
    );

    return response.ContentLength;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') {
      return undefined;
    }
    throw error;
  }
};

const getLocalSize = async (file: FileDocument, tenant: TenantSnapshot) => {
  const filePath = localPathForFile(file, tenant);

  if (!filePath) {
    return undefined;
  }

  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};

const getTenantSnapshot = async (db: Db): Promise<TenantSnapshot> => {
  const defaultTenant = defaultTenantSnapshot();
  const { client } = db as unknown as { client: { db: (dbName: string) => Db } };
  const tenant = await client
    .db(config.SHARED_DB)
    .collection('tenants')
    .findOne({ dbName: db.databaseName });

  if (tenant) {
    return tenant as any as TenantSnapshot;
  }

  return defaultTenant;
};

const createFileSizeResolver = (tenant: TenantSnapshot) => {
  const s3Client = tenant.featureFlags?.s3Storage ? buildS3Client() : undefined;

  return {
    getFileSize: async (file: FileDocument) => {
      if (tenant.featureFlags?.s3Storage && s3Client) {
        return getS3Size(s3Client, file, tenant);
      }

      return getLocalSize(file, tenant);
    },
    close: () => {
      s3Client?.destroy();
    },
  };
};

export { createFileSizeResolver, getTenantSnapshot, localPathForFile, s3KeyWithPath };
