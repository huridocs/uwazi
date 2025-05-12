import { ObjectId } from 'mongodb';

import { FileType, Fixture } from '../types';
import { generateFileName } from '../fileUtils';

const primaryDocument: FileType = {
  _id: new ObjectId(),
  originalname: 'originalDocument.pdf',
  filename: generateFileName({ originalname: 'originalDocument.pdf' }),
  type: 'document',
  mimetype: undefined,
  creationDate: 0,
};

const attachmentFile1: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentFile1.png',
  filename: generateFileName({ originalname: 'attachmentFile1.png' }),
  type: 'attachment',
  mimetype: undefined,
  creationDate: 1,
};

const attachmentFile2: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentFile2.txt',
  filename: generateFileName({ originalname: 'attachmentFile2.txt' }),
  type: 'attachment',
  mimetype: undefined,
  creationDate: 2,
};

const attachmentWithInvalidExtension: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentWithInvalidExtension.tx',
  filename: generateFileName({ originalname: 'attachmentWithInvalidExtension.tx' }),
  type: 'attachment',
  mimetype: undefined,
  creationDate: 3,
};

const fileWithDefinedMimeType: FileType = {
  _id: new ObjectId(),
  originalname: 'fileWithDefinedMimeType.pdf',
  filename: generateFileName({ originalname: 'fileWithDefinedMimeType.pdf' }),
  type: 'document',
  mimetype: 'application/pdf',
  creationDate: 4,
};

const fixtures: Fixture = {
  files: [
    primaryDocument,
    attachmentFile1,
    attachmentFile2,
    attachmentWithInvalidExtension,
    fileWithDefinedMimeType,
  ],
};

export {
  fixtures,
  primaryDocument,
  attachmentFile1,
  attachmentFile2,
  attachmentWithInvalidExtension,
  fileWithDefinedMimeType,
};
