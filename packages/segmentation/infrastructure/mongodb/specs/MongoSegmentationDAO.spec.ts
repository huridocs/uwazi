import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoSegmentationDAO } from '../MongoSegmentationDAO.js';
import { SegmentationDAOFactory } from '../../factories/SegmentationDAOFactory.js';

const f = getFixturesFactory();

const stored = {
  _id: f.id('stored'),
  fileID: f.id('file'),
  filename: 'file.pdf',
  status: 'queued',
  attempt: 0,
};

describe('MongoSegmentationDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({ segmentations: [stored] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const sut = () =>
    testingEnvironment.runWithContext(
      () => SegmentationDAOFactory.default().dao as MongoSegmentationDAO
    );

  const all = async () => testingEnvironment.db.getAllFrom('segmentations');

  it('should replace the fields of a stored document', async () => {
    await sut().replaceExisting({ ...stored, status: 'processing', attempt: 1, requestedAt: 5 });

    expect(await all()).toEqual([{ ...stored, status: 'processing', attempt: 1, requestedAt: 5 }]);
  });

  it('should not recreate a document that is gone', async () => {
    await sut().replaceExisting({ ...stored, _id: f.id('gone'), fileID: f.id('gone') });

    expect(await all()).toEqual([stored]);
  });

  it('should insert a document for a file that has none, and report it', async () => {
    const inserted = { ...stored, _id: f.id('new'), fileID: f.id('other'), status: 'idle' };

    expect(await sut().insertForFile(inserted)).toBe(true);
    expect(await all()).toEqual([stored, inserted]);
  });

  it('should not insert a second document for a file, and report it', async () => {
    expect(await sut().insertForFile({ ...stored, _id: f.id('second') })).toBe(false);
    expect(await all()).toEqual([stored]);
  });
});
