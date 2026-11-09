/* eslint-disable max-statements */
// Fixture bytes are written into the tenant temp dir. The files storage helper is not a fixture writer.
// eslint-disable-next-line no-restricted-imports
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import type { Application, NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { config } from '#api/config.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/index.js';
import { DBFixture } from '#api/utils/testing_db.js';
import uploadRoutes from '../routes.js';
import { adminUser } from './fixtures.js';

const JOB_NAME = 'CreateImageThumbnailJobHandler';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCAgKD88JCQgICAgICAgICAgICAgICgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAQABAAMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAADAAIEBQYHCP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfABf/2Q==',
  'base64'
);

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  entities: [
    {
      sharedId: 'publicEntity',
      language: 'en',
      title: 'Public',
      published: true,
    },
  ],
  files: [
    {
      entity: 'publicEntity',
      type: 'attachment',
      filename: 'photo.png',
      originalname: 'photo.png',
      mimetype: 'image/png',
    },
    {
      entity: 'publicEntity',
      type: 'attachment',
      filename: 'notes.txt',
      originalname: 'notes.txt',
      mimetype: 'text/plain',
    },
    {
      entity: 'publicEntity',
      type: 'thumbnail',
      filename: 'document-id.jpg',
      originalname: 'document thumb',
      mimetype: 'image/jpeg',
    },
  ],
};

const thumbnailJobs = async () =>
  getSharedConnection()
    .collection('jobs')
    .find({ name: JOB_NAME, namespace: tenants.current().name })
    .toArray();

describe('GET /files/thumbnails', () => {
  let app: Application;
  const previousFlag = config.imageThumbnails;

  beforeAll(async () => {
    testingEnvironment.setPermissions(adminUser);
    app = setUpApp(uploadRoutes, (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = adminUser;
      next();
    });
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.setupTenantTmpPaths(fixtures.files || []);
    const uploads = tenants.current().uploadedDocuments;
    await writeFile(path.join(uploads, 'photo.png'), PNG);
    await writeFile(path.join(uploads, 'notes.txt'), Buffer.from('notes'));
    await writeFile(path.join(uploads, 'document-id.jpg'), JPEG);
  });

  afterAll(async () => {
    config.imageThumbnails = previousFlag;
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    config.imageThumbnails = false;
    await getSharedConnection()
      .collection('jobs')
      .deleteMany({ name: JOB_NAME, namespace: tenants.current().name });
    const derivativeDir = path.join(tenants.current().uploadedDocuments, 'thumbnails', '640');
    await rm(derivativeDir, { recursive: true, force: true });
    await mkdir(derivativeDir, { recursive: true });
  });

  it('streams a stored pdf thumbnail before treating the name as a parent image', async () => {
    const response = await request(app).get('/files/thumbnails/document-id.jpg').buffer(true);

    expect(response.status).toBe(200);
    expect(response.body.subarray(0, 2).toString('hex')).toBe('ffd8');
    expect(await thumbnailJobs()).toHaveLength(0);
  });

  it('streams the original and does not enqueue when the flag is off', async () => {
    const response = await request(app).get('/files/thumbnails/photo.png');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(await thumbnailJobs()).toHaveLength(0);
  });

  it('enqueues one job and still streams the original when the flag is on and the derivative is missing', async () => {
    config.imageThumbnails = true;

    const response = await request(app).get('/files/thumbnails/photo.png');
    const second = await request(app).get('/files/thumbnails/photo.png');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(second.status).toBe(200);
    const jobs = await thumbnailJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].params).toMatchObject({ filename: 'photo.png' });
  });

  it('streams the stored jpeg when the derivative already exists', async () => {
    const derivative = path.join(
      tenants.current().uploadedDocuments,
      'thumbnails',
      '640',
      'photo.png'
    );
    await writeFile(derivative, JPEG);

    const response = await request(app).get('/files/thumbnails/photo.png').buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
    expect(response.body.subarray(0, 2).toString('hex')).toBe('ffd8');
    expect(await thumbnailJobs()).toHaveLength(0);
  });

  it('streams the original and does not enqueue when a skip marker exists', async () => {
    config.imageThumbnails = true;
    await writeFile(
      path.join(tenants.current().uploadedDocuments, 'thumbnails', '640', 'photo.png.skip'),
      Buffer.from('')
    );

    const response = await request(app).get('/files/thumbnails/photo.png');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(await thumbnailJobs()).toHaveLength(0);
  });

  it('streams an ineligible file and does not enqueue', async () => {
    config.imageThumbnails = true;

    const response = await request(app).get('/files/thumbnails/notes.txt');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(await thumbnailJobs()).toHaveLength(0);
  });
});
