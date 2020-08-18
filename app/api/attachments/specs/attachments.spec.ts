import db from 'api/utils/testing_db';
import relationships from 'api/relationships';
import fs from 'api/utils/async-fs';
import { search } from 'api/search';
import {
  attachmentsPath,
  fileExists,
  setupTestUploadedPaths,
  deleteFile,
} from 'api/files/filesystem';

import fixtures, { entityId, entityIdEn, attachmentToDelete, toDeleteId } from './fixtures';
import attachments from '../attachments';
import entities from '../../entities';

describe('attachments', () => {
  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    await db.clearAllAndLoad(fixtures);
    setupTestUploadedPaths();
  });

  afterAll(async () => db.disconnect());

  describe('/delete', () => {
    beforeEach(async () => {
      await fs.writeFile(attachmentsPath('attachment.txt'), 'dummy file');
      await fs.writeFile(attachmentsPath('mainFile.txt'), 'dummy file');
      await fs.writeFile(attachmentsPath(`${toDeleteId.toString()}.jpg`), 'dummy file');
      await fs.writeFile(attachmentsPath(`${entityId.toString()}.jpg`), 'dummy file');
      await fs.writeFile(attachmentsPath(`${entityIdEn.toString()}.jpg`), 'dummy file');
      spyOn(relationships, 'deleteTextReferences').and.returnValue(Promise.resolve());
    });

    it('should remove the passed file from attachments and delte the local file', async () => {
      expect(await fileExists(attachmentsPath('attachment.txt'))).toBe(true);

      const response = await attachments.delete(attachmentToDelete);
      const dbEntity = await entities.getById(toDeleteId);

      expect(response?._id.toString()).toBe(toDeleteId.toString());
      expect(response?.attachments?.length).toBe(1);
      expect(dbEntity?.attachments?.length).toBe(1);
      expect(dbEntity?.attachments?.[0]?.filename).toBe('other.doc');
      expect(await fileExists(attachmentsPath('attachment.txt'))).toBe(false);
    });

    it('should not delte the local file if other siblings are using it', async () => {
      expect(await fileExists(attachmentsPath('attachment.txt'))).toBe(true);
      const sibling = {
        title: 'title',
        sharedId: toDeleteId.toString(),
        attachments: [
          {
            filename: 'attachment.txt',
            originalname: 'common name 1.not',
          },
        ],
      };
      await entities.saveMultiple([sibling]);
      const response = await attachments.delete(attachmentToDelete);
      const dbEntity = await entities.getById(toDeleteId);

      expect(response?._id.toString()).toBe(toDeleteId.toString());
      expect(dbEntity?.attachments?.length).toBe(1);
      expect(await fileExists(attachmentsPath('attachment.txt'))).toBe(true);
    });

    it('should not fail if, for some reason, file doesnt exist', async () => {
      expect(await fileExists(attachmentsPath('attachment.txt'))).toBe(true);
      await deleteFile(attachmentsPath('attachment.txt'));
      await attachments.delete(attachmentToDelete);
    });
  });
});
