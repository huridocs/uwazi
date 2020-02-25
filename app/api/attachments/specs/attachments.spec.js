import db from 'api/utils/testing_db';
import path from 'path';
import relationships from 'api/relationships';
import fs from 'api/utils/async-fs';
import { search } from 'api/search';

import entities from '../../entities';
import fixtures, {
  sharedId,
  entityId,
  entityIdEn,
  attachmentToDelete,
  toDeleteId,
} from './fixtures';
import paths from '../../config/paths';
import attachments from '../attachments';

describe('attachments', () => {
  let originalAttachmentsPath;

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    originalAttachmentsPath = paths.attachments;

    await db.clearAllAndLoad(fixtures);
  });

  afterEach(() => {
    paths.attachments = originalAttachmentsPath;
  });

  afterAll(async () => db.disconnect());

  describe('/delete', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(paths.attachments, 'attachment.txt'), 'dummy file');
      await fs.writeFile(path.join(paths.attachments, 'mainFile.txt'), 'dummy file');
      await fs.writeFile(
        path.join(paths.attachments, `${toDeleteId.toString()}.jpg`),
        'dummy file'
      );
      await fs.writeFile(path.join(paths.attachments, `${entityId.toString()}.jpg`), 'dummy file');
      await fs.writeFile(
        path.join(paths.attachments, `${entityIdEn.toString()}.jpg`),
        'dummy file'
      );
      spyOn(relationships, 'deleteTextReferences').and.returnValue(Promise.resolve());
    });

    it('should remove main file and thumbnail if id matches entity', async () => {
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);

      const response = await attachments.delete(toDeleteId);
      const dbEntity = await entities.getById(toDeleteId);
      expect(response._id.toString()).toBe(toDeleteId.toString());
      expect(response.attachments.length).toBe(2);
      expect(dbEntity.attachments.length).toBe(2);
      expect(response.file).toBe(null);
      expect(dbEntity.file).toBe(null);
      expect(await fs.exists(path.join(paths.attachments, 'mainFile.txt'))).toBe(false);
      expect(await fs.exists(path.join(paths.attachments, `${toDeleteId.toString()}.jpg`))).toBe(
        false
      );
    });

    it('should remove main file on sibling entities', async () => {
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);
      const response = await attachments.delete(entityId);

      expect(response._id.toString()).toBe(entityId.toString());
      expect(response.file).toBe(null);
      expect(response.toc).toBe(null);

      const changedEntities = await entities.get({ sharedId });
      await Promise.all(
        changedEntities.map(async e => {
          expect(e.file).toBe(null);
          expect(e.file).toBe(null);
          expect(relationships.deleteTextReferences).toHaveBeenCalledWith(sharedId, e.language);
          expect(await fs.exists(path.join(paths.attachments, `${e._id.toString()}.jpg`))).toBe(
            false
          );
        })
      );
    });

    it('should remove the passed file from attachments and delte the local file', async () => {
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);
      const response = await attachments.delete(attachmentToDelete);
      const dbEntity = await entities.getById(toDeleteId);

      expect(response._id.toString()).toBe(toDeleteId.toString());
      expect(response.attachments.length).toBe(1);
      expect(dbEntity.attachments.length).toBe(1);
      expect(dbEntity.attachments[0].filename).toBe('other.doc');
      expect(await fs.exists(path.join(paths.attachments, 'attachment.txt'))).toBe(false);
    });

    it('should not delte the local file if other siblings are using it', async () => {
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);
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

      expect(response._id.toString()).toBe(toDeleteId.toString());
      expect(dbEntity.attachments.length).toBe(1);
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);
    });

    it('should not fail if, for some reason, file doesnt exist', async () => {
      expect(await fs.exists(`${paths.attachments}attachment.txt`)).toBe(true);
      await fs.unlink(`${paths.attachments}attachment.txt`);
      await attachments.delete(attachmentToDelete);
    });
  });
});
