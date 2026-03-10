import { AbstractEvent } from 'api/core/libs/eventsbus';
import { WithId } from 'api/odm/model';

import { FileType } from 'shared/types/fileType';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
