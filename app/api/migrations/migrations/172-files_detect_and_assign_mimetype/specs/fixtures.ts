import { ObjectId } from 'mongodb';

import { FileType, Fixture } from '../types';
import { generateFileName } from '../fileUtils';

const primaryDocument: FileType = {
  _id: new ObjectId(),
  originalname: 'originalDocument.pdf',
  filename: generateFileName({ originalname: 'originalDocument.pdf' }),
  type: 'document',
  creationDate: 0,
};

const primaryDocument2: FileType = {
  _id: new ObjectId(),
  originalname: 'primaryDocument2.pdf',
  mimetype: '',
  filename: generateFileName({ originalname: 'primaryDocument2.pdf' }),
  type: 'document',
  creationDate: 0,
};

const primaryDocument3: FileType = {
  _id: new ObjectId(),
  originalname: 'primaryDocument3.pdf',
  mimetype: null as any,
  filename: generateFileName({ originalname: 'primaryDocument3.pdf' }),
  type: 'document',
  creationDate: 0,
};

const primaryDocument4: FileType = {
  _id: new ObjectId(),
  originalname: 'primaryDocument3.pdf',
  mimetype: undefined,
  filename: generateFileName({ originalname: 'primaryDocument4.pdf' }),
  type: 'document',
  creationDate: 0,
};

const attachmentFile1: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentFile1.png',
  filename: generateFileName({ originalname: 'attachmentFile1.png' }),
  type: 'attachment',
  creationDate: 1,
};

const attachmentFile2: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentFile2.txt',
  filename: generateFileName({ originalname: 'attachmentFile2.txt' }),
  type: 'attachment',
  creationDate: 2,
};

const attachmentWithInvalidExtension: FileType = {
  _id: new ObjectId(),
  originalname: 'attachmentWithInvalidExtension.tx',
  filename: generateFileName({ originalname: 'attachmentWithInvalidExtension.tx' }),
  type: 'attachment',
  creationDate: 3,
};

const fileWithDefinedMimeType: FileType = {
  _id: new ObjectId(),
  originalname: 'fileWithDefinedMimeType.txt',
  filename: generateFileName({ originalname: 'fileWithDefinedMimeType.txt' }),
  type: 'document',
  mimetype: 'application/pdf',
  creationDate: 4,
};

const fixtures: Fixture = {
  files: [
    primaryDocument,
    primaryDocument2,
    primaryDocument3,
    primaryDocument4,
    attachmentFile1,
    attachmentFile2,
    attachmentWithInvalidExtension,
    fileWithDefinedMimeType,
  ],
};

export {
  fixtures,
  primaryDocument,
  primaryDocument2,
  primaryDocument3,
  primaryDocument4,
  attachmentFile1,
  attachmentFile2,
  attachmentWithInvalidExtension,
  fileWithDefinedMimeType,
};
