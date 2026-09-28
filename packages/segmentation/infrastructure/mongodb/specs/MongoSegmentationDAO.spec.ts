import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoSegmentationDAO } from '../MongoSegmentationDAO.js';
import { SegmentationDAOFactory } from '../../factories/SegmentationDAOFactory.js';

const f = getFixturesFactory();

const legacyClaim = {
  _id: f.id('claim'),
  fileID: f.id('file'),
  filename: 'file.pdf',
  status: 'processing',
  autoexpire: new Date(),
};

describe('MongoSegmentationDAO', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({ segmentations: [legacyClaim] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const sut = () =>
    testingEnvironment.runWithContext(
      () => SegmentationDAOFactory.default().dao as MongoSegmentationDAO
    );

  const stored = async () => testingEnvironment.db.getAllFrom('segmentations');

  it('should clear the TTL field when it replaces a document', async () => {
    await sut().replaceExisting({ ...legacyClaim, status: 'idle', attempt: 0 });

    expect(await stored()).toEqual([
      {
        _id: f.id('claim'),
        fileID: f.id('file'),
        filename: 'file.pdf',
        status: 'idle',
        attempt: 0,
        autoexpire: null,
      },
    ]);
  });

  it('should clear the TTL field on documents it inserts', async () => {
    await sut().insertForFile({
      _id: f.id('new'),
      fileID: f.id('other'),
      filename: 'other.pdf',
      status: 'idle',
      autoexpire: new Date(),
    });

    expect((await stored()).find(doc => doc._id.equals(f.id('new')))?.autoexpire).toBeNull();
  });

  it('should not recreate a document that is gone', async () => {
    await sut().replaceExisting({
      _id: f.id('gone'),
      fileID: f.id('gone'),
      filename: 'gone.pdf',
      status: 'idle',
    });

    expect(await stored()).toHaveLength(1);
  });
});
