// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../files/events/FilesDeletedEv... Remove this comment to see the full error message
import { FilesDeletedEvent } from '../files/events/FilesDeletedEvent.js';
import { SegmentationModel } from './segmentationModel';

const registerEventListeners = (eventsBus: EventsBus) => {
  // @ts-expect-error TS(7031): Binding element 'files' implicitly has an 'any' ty... Remove this comment to see the full error message
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
    await SegmentationModel.delete({ fileID: { $in: files.map(f => f._id) } });
  });
};

export { registerEventListeners };
