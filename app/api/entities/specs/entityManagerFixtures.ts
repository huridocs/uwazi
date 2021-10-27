import db, { DBFixture } from 'api/utils/testing_db';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { FileType } from 'shared/types/fileType';

const templateId = db.id();
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

const fixtures: DBFixture = {
  entities: [
    {
      _id: entityId,
      sharedId: 'shared1',
      language: 'en',
      title: 'entity1',
    },
  ],
  files: [
    { ...textFile },
    {
      _id: db.id(),
      entity: 'shared1',
      language: 'en',
      originalname: 'Sample PDF File.pdf',
      filename: 'samplepdffile.pdf',
      mimetype: 'application/pdf',
      type: 'attachment',
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'template1',
      commonProperties: [],
      properties: [],
    },
  ],
  settings: [
    { _id: db.id(), languages: [{ key: 'en', default: true }, { key: 'pt' }, { key: 'es' }] },
  ],
  users: [editorUser],
};

export { fixtures, templateId, editorUser, entityId, textFile };
