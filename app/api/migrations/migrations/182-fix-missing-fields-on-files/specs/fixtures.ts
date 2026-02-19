import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

const fileMissingCreationDateId = ObjectId.createFromTime(1715000000);
const fileMissingSizeLocalId = new ObjectId();
const fileMissingSizeS3Id = new ObjectId();
const fileAlreadyCompleteId = new ObjectId();
const fileMissingBothLocalId = ObjectId.createFromTime(1716000000);
const fileMissingBothS3Id = ObjectId.createFromTime(1717000000);

const fileMissingCreationDate = {
  _id: fileMissingCreationDateId,
  filename: 'with-date.pdf',
  type: 'document' as const,
  size: 32,
};

const fileMissingSizeLocal = {
  _id: fileMissingSizeLocalId,
  filename: 'local-file-size.pdf',
  type: 'document' as const,
  creationDate: 123,
};

const fileMissingSizeS3 = {
  _id: fileMissingSizeS3Id,
  filename: 's3-file-size.pdf',
  type: 'document' as const,
  creationDate: 123,
};

const fileAlreadyComplete = {
  _id: fileAlreadyCompleteId,
  filename: 'already-complete.pdf',
  type: 'document' as const,
  creationDate: 111,
  size: 222,
};

const fileMissingBothLocal = {
  _id: fileMissingBothLocalId,
  filename: 'local-file-missing-both.pdf',
  type: 'document' as const,
};

const fileMissingBothS3 = {
  _id: fileMissingBothS3Id,
  filename: 's3-file-missing-both.pdf',
  type: 'document' as const,
};

export const fixtures: Fixture = {
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],

  files: [
    fileAlreadyComplete,
    fileMissingCreationDate,
    fileMissingSizeLocal,
    fileMissingSizeS3,
    fileMissingBothLocal,
    fileMissingBothS3,
  ],
};

export {
  fileAlreadyComplete,
  fileAlreadyCompleteId,
  fileMissingCreationDate,
  fileMissingCreationDateId,
  fileMissingSizeLocal,
  fileMissingSizeLocalId,
  fileMissingSizeS3,
  fileMissingSizeS3Id,
  fileMissingBothLocal,
  fileMissingBothLocalId,
  fileMissingBothS3,
  fileMissingBothS3Id,
};
