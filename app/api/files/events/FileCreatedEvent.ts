// @ts-expect-error TS(2307): Cannot find module '../eventsbus/index.js' or its ... Remove this comment to see the full error message
import { AbstractEvent } from '../eventsbus/index.js';

import { WithId } from '../odm/index.js';

// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
