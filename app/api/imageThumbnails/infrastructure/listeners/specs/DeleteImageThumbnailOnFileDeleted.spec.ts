/* eslint-disable max-statements */
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteImageThumbnailOnFileDeletedFactory } from '../../factories/DeleteImageThumbnailOnFileDeletedFactory.js';

const JOB_NAME = 'DeleteFileFromStorageJobHandler';

describe('DeleteImageThumbnailOnFileDeleted', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await getConnection().collection('jobs').deleteMany({ name: JOB_NAME });
  });

  const handle = async (filename: string) =>
    testingEnvironment.runWithContext(async () =>
      DeleteImageThumbnailOnFileDeletedFactory.default().handle(async () => {}, {
        fileId: 'file-1',
        filename,
      })
    );

  const paths = async () =>
    (await getConnection().collection('jobs').find({ name: JOB_NAME }).toArray()).map(
      job => job.params.filePath as string
    );

  it('deletes the jpeg and the skip marker for an eligible file', async () => {
    await handle('photo.png');

    const stored = await paths();
    expect(stored).toHaveLength(2);
    expect(stored).toEqual(
      expect.arrayContaining([
        expect.stringContaining('thumbnails/640/photo.png'),
        expect.stringContaining('thumbnails/640/photo.png.skip'),
      ])
    );
  });

  it('keeps the stored filename case', async () => {
    await handle('photo.PNG');

    const stored = await paths();
    expect(stored).toEqual(
      expect.arrayContaining([
        expect.stringContaining('thumbnails/640/photo.PNG'),
        expect.stringContaining('thumbnails/640/photo.PNG.skip'),
      ])
    );
  });

  it('does not delete anything for an ineligible file', async () => {
    await handle('notes.txt');

    expect(await paths()).toHaveLength(0);
  });
});
