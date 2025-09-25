import { EventsBus } from '#api/eventsbus/index.js';

import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { SegmentationModel } from './segmentationModel';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await SegmentationModel.delete({ fileID: { $in: files.map(f => f._id) } });
  });
};

export { registerEventListeners };
