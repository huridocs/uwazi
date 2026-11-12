/* eslint-disable max-statements */
import { config } from '#api/config.js';
import { FileDTO } from '#api/core/domain/files/domainTypes.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { EnqueueImageThumbnailOnFileCreatedFactory } from '../../factories/EnqueueImageThumbnailOnFileCreatedFactory.js';

const JOB_NAME = 'CreateImageThumbnailJobHandler';

const image = {
  _id: 'image-1',
  filename: 'photo.png',
  originalname: 'photo.png',
  mimetype: 'image/png',
  size: 1,
  creationDate: 1,
  type: 'attachment' as const,
  entity: 'entity-1',
};

describe('EnqueueImageThumbnailOnFileCreated', () => {
  const previousFlag = config.imageThumbnails;

  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    config.imageThumbnails = previousFlag;
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    config.imageThumbnails = false;
    await getConnection().collection('jobs').deleteMany({ name: JOB_NAME });
  });

  const handle = async (file: { type: string; filename: string; url?: string }) =>
    testingEnvironment.runWithContext(async () =>
      EnqueueImageThumbnailOnFileCreatedFactory.default().handle(async () => {}, {
        file: { ...image, ...file } as FileDTO,
      })
    );

  const jobs = async () => getConnection().collection('jobs').find({ name: JOB_NAME }).toArray();

  it('enqueues a thumbnail for an image when the flag is on', async () => {
    config.imageThumbnails = true;

    await handle(image);

    const stored = await jobs();
    expect(stored).toHaveLength(1);
    expect(stored[0].params).toMatchObject({ filename: 'photo.png' });
  });

  it('does not enqueue when the flag is off', async () => {
    await handle(image);

    expect(await jobs()).toHaveLength(0);
  });

  it('enqueues a custom file when its extension is eligible', async () => {
    config.imageThumbnails = true;

    await handle({ ...image, type: 'custom', filename: 'logo.png' });

    expect(await jobs()).toHaveLength(1);
    expect((await jobs())[0].params).toMatchObject({ filename: 'logo.png' });
  });

  it('does not enqueue a pdf thumbnail row or a remote url', async () => {
    config.imageThumbnails = true;

    await handle({ ...image, type: 'thumbnail', filename: 'document-id.jpg' });
    await handle({ ...image, filename: 'remote.jpg', url: 'http://example.com/remote.jpg' });

    expect(await jobs()).toHaveLength(0);
  });
});
