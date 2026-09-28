import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SegmentOnFileCreated } from '../SegmentOnFileCreated.js';
import {
  f,
  withSegmentations,
  useBackend,
  storedSegmentations,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

describe('SegmentOnFileCreated', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    useBackend(false);
    await testingEnvironment.setFixtures(withSegmentations(false, []));
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should register the segmentation of a created PDF', async () => {
    const eventsBus = new EventsBus();
    SegmentOnFileCreated.register(eventsBus);

    await testingEnvironment.runWithContext(async () =>
      eventsBus.emit(
        new FileCreatedEvent({
          newFile: {
            _id: f.id('created'),
            filename: 'created.pdf',
            type: 'document',
            mimetype: 'application/pdf',
          },
        })
      )
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
