import { AbstractEvent } from 'api/eventsbus';
import { WithId } from 'api/odm/model';

import { FileType } from '../../shared/types/fileType.js';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
