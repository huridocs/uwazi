/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import testingDB from '#api/utils/testing_db.js';
import {
  fileAlreadyCompleteId,
  fileMissingBothLocalId,
  fileMissingBothS3Id,
  fileMissingCreationDateId,
  fileMissingSizeLocal,
  fileMissingSizeLocalId,
  fileMissingSizeS3,
  fileMissingSizeS3Id,
  fixtures,
} from './fixtures.js';
import migration from '../index.js';

const createSut = () => ({
  sut: {
    ...migration,
    up: async () => migration.up(testingDB.mongodb!),
  },
});

describe('migration fix-missing-fields-on-files', () => {
  const uploadsPath = path.join(__dirname, '../../../../files/specs/uploads/182-migration');
  const customUploadsPath = path.join(
    __dirname,
    '../../../../files/specs/customUploads/182-migration'
  );

  let s3Client: S3Client;
  const bucket = process.env.S3_BUCKET || 'uwazi-development';

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await testingDB.setupFixturesAndContext(fixtures);

    await mkdir(uploadsPath, { recursive: true });
    await mkdir(customUploadsPath, { recursive: true });

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .deleteMany({ dbName: testingDB.dbName });

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .insertOne({
        name: 'test-tenant',
        dbName: testingDB.dbName,
        uploadedDocuments: uploadsPath,
        attachments: uploadsPath,
        customUploads: customUploadsPath,
        featureFlags: { s3Storage: false },
      });

    s3Client = new S3Client({
      apiVersion: 'latest',
      region: process.env.S3_REGION || 'region',
      forcePathStyle: true,
      endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
      },
    });

    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error?.name)) {
        throw error;
      }
    }
  });

  afterAll(async () => {
    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .deleteMany({ dbName: testingDB.dbName });

    await rm(uploadsPath, { recursive: true, force: true });
    await rm(customUploadsPath, { recursive: true, force: true });

    s3Client.destroy();
    await testingDB.tearDown();
  });

  afterEach(async () => {
    await testingDB.clearAllAndLoadFixtures(fixtures);
  });

  it('should have a delta number', () => {
    const { sut } = createSut();
    expect(sut.delta).toBe(182);
  });

  it('should generate creationDate based on mongodb _id timestamp for files with missing creationDate', async () => {
    const { sut } = createSut();

    await sut.up();

    const file = await testingDB
      .mongodb!.collection('files')
      .findOne({ _id: fileMissingCreationDateId });

    expect(file!.creationDate).toBe(fileMissingCreationDateId.getTimestamp().getTime());
    expect(file!.size).toBe(32);
  });

  it('should get size from the file system for files with missing size', async () => {
    const { sut } = createSut();

    await writeFile(path.join(uploadsPath, fileMissingSizeLocal.filename), '1234567');

    await sut.up();

    const file = await testingDB
      .mongodb!.collection('files')
      .findOne({ _id: fileMissingSizeLocalId });

    expect(file!.size).toBe(7);
    expect(file!.creationDate).toBe(123);
  });

  it('should get size from the s3 for files with missing size', async () => {
    const { sut } = createSut();
    const key = `test-tenant/182-migration/${fileMissingSizeS3.filename}`;
    const content = '1234567890123';

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .updateOne({ dbName: testingDB.dbName }, { $set: { featureFlags: { s3Storage: true } } });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
      })
    );

    await sut.up();

    const file = await testingDB.mongodb!.collection('files').findOne({ _id: fileMissingSizeS3Id });

    expect(file!.size).toBe(content.length);
    expect(file!.creationDate).toBe(123);

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .updateOne({ dbName: testingDB.dbName }, { $set: { featureFlags: { s3Storage: false } } });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  });

  it('should set size to zero and creationDate from _id when local file does not exist', async () => {
    const { sut } = createSut();

    await sut.up();

    const file = await testingDB
      .mongodb!.collection('files')
      .findOne({ _id: fileMissingBothLocalId });

    expect(file!.size).toBe(0);
    expect(file!.creationDate).toBe(fileMissingBothLocalId.getTimestamp().getTime());
  });

  it('should set size to zero and creationDate from _id when s3 file does not exist', async () => {
    const { sut } = createSut();

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .updateOne({ dbName: testingDB.dbName }, { $set: { featureFlags: { s3Storage: true } } });

    await sut.up();

    const file = await testingDB.mongodb!.collection('files').findOne({ _id: fileMissingBothS3Id });

    expect(file!.size).toBe(0);
    expect(file!.creationDate).toBe(fileMissingBothS3Id.getTimestamp().getTime());

    await testingDB
      .db('uwazi_shared_db')
      .collection('tenants')
      .updateOne({ dbName: testingDB.dbName }, { $set: { featureFlags: { s3Storage: false } } });
  });

  it('should not update files that already have creationDate and size', async () => {
    const { sut } = createSut();

    await sut.up();

    const file = await testingDB
      .mongodb!.collection('files')
      .findOne({ _id: fileAlreadyCompleteId });

    expect(file!.creationDate).toBe(111);
    expect(file!.size).toBe(222);
  });
});
