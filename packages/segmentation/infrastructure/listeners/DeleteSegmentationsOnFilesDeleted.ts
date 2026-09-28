import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { handleError } from '#api/utils/handleError.js';
import { AfterCommitContext } from './AfterCommitContext.js';
import { DeleteFileSegmentationsFactory } from '../factories/DeleteFileSegmentationsFactory.js';

/**
 * Removes the segmentations of deleted files. The files are already gone when this runs, so a
 * failure is reported rather than thrown.
 */
class DeleteSegmentationsOnFilesDeleted {
  static register(eventsBus: EventsBus) {
    eventsBus.on(FilesDeletedEvent, async ({ files }) => {
      try {
        await AfterCommitContext.run(async () =>
          DeleteFileSegmentationsFactory.default().execute({
            fileIds: files.flatMap(file => (file._id ? [file._id.toString()] : [])),
          })
        );
      } catch (error) {
        handleError(error);
      }
    });
  }
}

export { DeleteSegmentationsOnFilesDeleted };
