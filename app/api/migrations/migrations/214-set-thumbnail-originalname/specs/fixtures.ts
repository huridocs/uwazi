import { ObjectId } from 'mongodb';
import { FileDocument, Fixture } from '../types.js';

const missingOriginalnameId = new ObjectId();
const nullOriginalnameId = new ObjectId();
const emptyOriginalnameId = new ObjectId();
const alreadyNamedId = new ObjectId();
const documentMissingOriginalnameId = new ObjectId();
const thumbnailWithoutFilenameId = new ObjectId();
const thumbnailWithEmptyFilenameId = new ObjectId();

const missingOriginalname: FileDocument = {
  _id: missingOriginalnameId,
  filename: 'missing.jpg',
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-missing',
  language: 'eng',
  size: 100,
  creationDate: 1,
};

const nullOriginalname: FileDocument = {
  _id: nullOriginalnameId,
  filename: 'null-name.jpg',
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-null',
  language: 'spa',
  size: 200,
  creationDate: 2,
};

const emptyOriginalname: FileDocument = {
  _id: emptyOriginalnameId,
  filename: 'empty-name.jpg',
  originalname: '',
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-empty',
  language: 'fra',
  size: 300,
  creationDate: 3,
};

const alreadyNamed: FileDocument = {
  _id: alreadyNamedId,
  filename: 'stored-file.jpg',
  originalname: 'Human Name.jpg',
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-named',
  language: 'eng',
  size: 400,
  creationDate: 4,
};

const documentMissingOriginalname: FileDocument = {
  _id: documentMissingOriginalnameId,
  filename: 'doc.pdf',
  type: 'document',
  mimetype: 'application/pdf',
  entity: 'entity-document',
  language: 'eng',
  size: 500,
  creationDate: 5,
};

const thumbnailWithoutFilename: FileDocument = {
  _id: thumbnailWithoutFilenameId,
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-no-filename',
  language: 'eng',
  size: 600,
  creationDate: 6,
};

const thumbnailWithEmptyFilename: FileDocument = {
  _id: thumbnailWithEmptyFilenameId,
  filename: '',
  type: 'thumbnail',
  mimetype: 'image/jpeg',
  entity: 'entity-empty-filename',
  language: 'eng',
  size: 700,
  creationDate: 7,
};

const fixtures: Fixture = {
  files: [
    missingOriginalname,
    nullOriginalname,
    emptyOriginalname,
    alreadyNamed,
    documentMissingOriginalname,
    thumbnailWithoutFilename,
    thumbnailWithEmptyFilename,
  ],
};

const emptyFixtures: Fixture = { files: [] };

export {
  alreadyNamedId,
  documentMissingOriginalnameId,
  emptyFixtures,
  emptyOriginalnameId,
  fixtures,
  missingOriginalnameId,
  nullOriginalnameId,
  thumbnailWithEmptyFilenameId,
  thumbnailWithoutFilenameId,
};
