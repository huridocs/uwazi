import db, { DBFixture } from 'api/utils/testing_db';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { FileType } from 'shared/types/fileType';

const template1Id = db.id();
const template2Id = db.id();
const entityId = db.id();

const editorUser: UserSchema = {
  _id: db.id(),
  email: 'user1@test.test',
  role: UserRole.EDITOR,
  username: 'user1',
};

const textFile: FileType = {
  _id: db.id(),
  entity: 'shared1',
  language: 'en',
  originalname: 'Sample Text File.txt',
  filename: 'samplefile.txt',
  mimetype: 'text/plain',
  type: 'attachment',
};

const pdfFile: FileType = {
  _id: db.id(),
  entity: 'shared1',
  language: 'en',
  originalname: 'Sample PDF File.pdf',
  filename: 'samplepdffile.pdf',
  mimetype: 'application/pdf',
  type: 'attachment',
};

const fixtures: DBFixture = {
  entities: [
    {
      _id: entityId,
      sharedId: 'shared1',
      language: 'en',
      title: 'entity1',
    },
  ],
  files: [{ ...textFile }, { ...pdfFile }],
  templates: [
    {
      _id: template1Id,
      name: 'template1',
      commonProperties: [],
      properties: [],
    },
    {
      _id: template2Id,
      name: 'template2',
      commonProperties: [],
      properties: [
        {
          _id: db.id(),
          label: 'Text',
          type: 'text',
          name: 'text',
        },
        {
          _id: db.id(),
          label: 'Image',
          type: 'image',
          name: 'image',
        },
      ],
    },
  ],
  settings: [
    { _id: db.id(), languages: [{ key: 'en', default: true }, { key: 'pt' }, { key: 'es' }] },
  ],
  users: [editorUser],
};

export { fixtures, template1Id, template2Id, editorUser, entityId, textFile, pdfFile };
