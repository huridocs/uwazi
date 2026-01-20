import { EventsBus } from '#api/core/libs/eventsbus/index.js';

import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { SegmentationModel } from '#api/services/pdfsegmentation/segmentationModel.js';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await SegmentationModel.delete({ fileID: { $in: files.map(f => f._id) } });
  });
};

export { registerEventListeners };
