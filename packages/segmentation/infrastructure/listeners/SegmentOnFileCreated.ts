import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FileCreatedEvent } from '#api/files/events/FileCreatedEvent.js';
import { handleError } from '#api/utils/handleError.js';
import { RegisterFileSegmentationFactory } from '../factories/RegisterFileSegmentationFactory.js';

/**
 * Registers the segmentation of every file created. It runs inline, after the file was committed,
 * so a failure here is reported rather than thrown: the upload itself already succeeded.
 */
class SegmentOnFileCreated {
  static register(eventsBus: EventsBus) {
    eventsBus.on(FileCreatedEvent, async ({ newFile }) => {
      try {
        await RegisterFileSegmentationFactory.default().execute({
          fileId: newFile._id.toString(),
          filename: newFile.filename!,
          type: newFile.type,
          mimetype: newFile.mimetype,
        });
      } catch (error) {
        handleError(error);
      }
    });
  }
}

export { SegmentOnFileCreated };
