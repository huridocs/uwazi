import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteSegmentationsOnFileDeletedFactory } from '../../factories/DeleteSegmentationsOnFileDeletedFactory.js';
import {
  f,
  idle,
  withSegmentations,
  selectBackend,
  storedSegmentations,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

describe('DeleteSegmentationsOnFileDeleted', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    await testingEnvironment.setupTenantTmpPaths([]);
    selectBackend(false);
    await testingEnvironment.setFixtures(withSegmentations(false, [idle('a'), idle('b')]));
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete the segmentation of the deleted file', async () => {
    await testingEnvironment.runWithContext(async () =>
      DeleteSegmentationsOnFileDeletedFactory.default().handle(
        jest.fn().mockResolvedValue(undefined),
        { fileId: f.idString('file-a') }
      )
    );

    expect((await storedSegmentations(false)).map(s => s.filename)).toEqual(['b.pdf']);
  });
});
