import { EventsBus } from 'api/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { SegmentationModel } from './segmentationModel';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await SegmentationModel.delete({ fileId: { $in: files.map(f => f._id) } });
  });
};

export { registerEventListeners };
