import { AbstractEvent } from '../eventsbus.js';
import { WithId } from '../odm/model.js';

import { FileType } from '../../shared/types/fileType.js';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
