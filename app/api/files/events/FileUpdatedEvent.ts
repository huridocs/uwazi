// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { AbstractEvent } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';

interface FileUpdatedData {
  before: FileType;
  after: FileType;
}

class FileUpdatedEvent extends AbstractEvent<FileUpdatedData> {}

export { FileUpdatedEvent };
