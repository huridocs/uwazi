import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { FileAttachmentDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { FileAttachment } from '../FileAttachment.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('FileAttachment', () => {
  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('att');
      const file = FileBuilder.attachment(id, {
        originalname: 'document.txt',
        filename: 'abc123.txt',
        mimetype: 'text/plain',
        size: 1024,
        creationDate: 1000000000,
        entity: 'sharedId1',
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'document.txt',
        filename: 'abc123.txt',
        mimetype: 'text/plain',
        size: 1024,
        creationDate: 1000000000,
        entity: 'sharedId1',
        type: 'attachment',
      });
    });
  });

  describe('fromDBO', () => {
    it('should map all fields including the content loader', () => {
      const _id = new ObjectId();
      const dbo: FileAttachmentDBO = {
        _id,
        originalname: 'document.txt',
        filename: 'abc123.txt',
        mimetype: 'text/plain',
        size: 1024,
        creationDate: 1000000000,
        type: 'attachment',
        entity: 'sharedId1',
      };
      const content = FileBuilder.content('attachment bytes');
      const contentLoader = jest.fn().mockReturnValue(content);

      const file = FileAttachment.fromDBO(dbo, contentLoader);

      expect(file).toBeInstanceOf(FileAttachment);
      expect(file.id).toBe(_id.toString());
      expect(file.originalname).toBe('document.txt');
      expect(file.filename).toBe('abc123.txt');
      expect(file.mimetype).toBe('text/plain');
      expect(file.size).toBe(1024);
      expect(file.creationDate).toBe(1000000000);
      expect(file.entity).toBe('sharedId1');
      expect(file.content).toBe(content);
      expect(contentLoader).toHaveBeenCalledWith({ type: 'attachment', filename: 'abc123.txt' });
    });
  });

  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const content = FileBuilder.content('attachment bytes');
      const file = FileBuilder.attachment(f.idString('att'), {
        originalname: 'original.txt',
        entity: 'sharedId1',
        content,
      });
      const updated = file.update({ originalname: 'renamed.txt' });

      expect(updated).toBeInstanceOf(FileAttachment);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.txt' });
      expect(updated.content).toBe(content);
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.txt');
    });
  });
});
