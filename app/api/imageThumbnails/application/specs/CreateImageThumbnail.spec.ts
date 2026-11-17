/* eslint-disable max-statements */
// Fixture bytes are written into the tenant temp dir. The files storage helper is not a fixture writer.
// eslint-disable-next-line no-restricted-imports
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import { ImageThumbnailRejected } from '../../domain/imageThumbnailErrors.js';
import { CreateImageThumbnailFactory } from '../../infrastructure/factories/CreateImageThumbnailFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/index.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const BMP = Buffer.from(
  'Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAAATCwAAEwsAAAAAAAAAAAAAAAD/AA==',
  'base64'
);

describe('CreateImageThumbnail', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
      entities: [{ sharedId: 'entity', language: 'en', title: 'Entity', published: true }],
      files: [
        {
          entity: 'entity',
          type: 'attachment',
          filename: 'photo.png',
          originalname: 'photo.png',
          mimetype: 'image/png',
        },
        {
          entity: 'entity',
          type: 'attachment',
          filename: 'broken.png',
          originalname: 'broken.png',
          mimetype: 'image/png',
        },
        {
          entity: 'entity',
          type: 'attachment',
          filename: 'dot.bmp',
          originalname: 'dot.bmp',
          mimetype: 'image/bmp',
        },
      ],
    });
    await testingEnvironment.setupTenantTmpPaths([]);
    const uploads = tenants.current().uploadedDocuments;
    await writeFile(path.join(uploads, 'photo.png'), PNG);
    await writeFile(path.join(uploads, 'broken.png'), Buffer.from('not an image'));
    await writeFile(path.join(uploads, 'dot.bmp'), BMP);
    await mkdir(path.join(uploads, 'thumbnails', '640'), { recursive: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const derivative = (filename: string) =>
    path.join(tenants.current().uploadedDocuments, 'thumbnails', '640', filename);

  it('writes a jpeg beside the parent filename and does not enlarge a small image', async () => {
    const useCase = testingEnvironment.runWithContext(() => CreateImageThumbnailFactory.default());

    await useCase.execute({ filename: 'photo.png' }, false);

    const jpeg = await readFile(derivative('photo.png'));
    expect(jpeg.subarray(0, 2).toString('hex')).toBe('ffd8');
  });

  it('writes a skip marker when the file cannot be decoded', async () => {
    const useCase = testingEnvironment.runWithContext(() => CreateImageThumbnailFactory.default());

    await expect(useCase.execute({ filename: 'broken.png' }, false)).rejects.toBeInstanceOf(
      ImageThumbnailRejected
    );
    const marker = await readFile(derivative('broken.png.skip'));
    expect(marker.byteLength).toBeGreaterThan(0);
  });

  it('rejects a BMP the built-in package cannot decode', async () => {
    const useCase = testingEnvironment.runWithContext(() => CreateImageThumbnailFactory.default());

    await expect(useCase.execute({ filename: 'dot.bmp' }, false)).rejects.toBeInstanceOf(
      ImageThumbnailRejected
    );
    const marker = await readFile(derivative('dot.bmp.skip'));
    expect(marker.byteLength).toBeGreaterThan(0);
  });
});
