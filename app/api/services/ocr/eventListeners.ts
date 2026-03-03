import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { cleanupRecordsOfFiles } from './ocrRecords.js';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await cleanupRecordsOfFiles(files.map(f => f._id));
  });
};

export { registerEventListeners };
