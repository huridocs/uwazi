import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DeleteSegmentationsOnFilesDeleted } from '../DeleteSegmentationsOnFilesDeleted.js';
import {
  f,
  idle,
  withSegmentations,
  selectBackend,
  storedSegmentations,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

describe('DeleteSegmentationsOnFilesDeleted', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    await testingEnvironment.setupTenantTmpPaths([]);
    selectBackend(false);
    await testingEnvironment.setFixtures(withSegmentations(false, [idle('a'), idle('b')]));
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete the segmentations of the deleted files', async () => {
    const eventsBus = new EventsBus();
    DeleteSegmentationsOnFilesDeleted.register(eventsBus);

    await testingEnvironment.runWithContext(async () =>
      eventsBus.emit(new FilesDeletedEvent({ files: [{ _id: f.id('file-a') }] as never }))
    );

    expect((await storedSegmentations(false)).map(s => s.filename)).toEqual(['b.pdf']);
  });
});
