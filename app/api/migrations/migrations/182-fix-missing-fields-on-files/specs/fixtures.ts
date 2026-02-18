import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

const fileMissingCreationDateId = ObjectId.createFromTime(1715000000);
const fileMissingSizeLocalId = new ObjectId();
const fileMissingSizeS3Id = new ObjectId();
const fileAlreadyCompleteId = new ObjectId();

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

export const fixtures: Fixture = {
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],

  files: [fileAlreadyComplete, fileMissingCreationDate, fileMissingSizeLocal, fileMissingSizeS3],
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
};
