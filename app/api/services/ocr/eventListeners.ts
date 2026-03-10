import { EventsBus } from 'api/core/libs/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { cleanupRecordsOfFiles } from './ocrRecords';

const registerEventListeners = (eventsBus: EventsBus) => {
  eventsBus.on(FilesDeletedEvent, async ({ files }) => {
    await cleanupRecordsOfFiles(files.map(f => f._id));
  });
};

export { registerEventListeners };
