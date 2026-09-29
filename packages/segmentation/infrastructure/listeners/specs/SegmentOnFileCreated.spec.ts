import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SegmentOnFileCreatedFactory } from '../../factories/SegmentOnFileCreatedFactory.js';
import {
  f,
  withSegmentations,
  selectBackend,
  storedSegmentations,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

describe('SegmentOnFileCreated', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    selectBackend(false);
    await testingEnvironment.setFixtures(withSegmentations(false, []));
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should register the segmentation of a created PDF', async () => {
    await testingEnvironment.runWithContext(async () =>
      SegmentOnFileCreatedFactory.default().handle(jest.fn().mockResolvedValue(undefined), {
        file: {
          _id: f.idString('created'),
          filename: 'created.pdf',
          originalname: 'created.pdf',
          type: 'document',
          mimetype: 'application/pdf',
          entity: 'entity',
          size: 1,
          creationDate: 1,
          status: 'ready',
        } as never,
      })
    );

    expect(await storedSegmentations(false)).toEqual([
      {
        id: expect.any(String),
        fileId: f.idString('created'),
        filename: 'created.pdf',
        status: 'idle',
      },
    ]);
  });
});
