import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { FileAttachment } from '../FileAttachment.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('FileAttachment', () => {
  describe('validation', () => {
    it('throws when entity is empty', () => {
      expect(
        () =>
          new FileAttachment({
            id: 'id',
            entity: '  ',
            filename: 'file.txt',
            originalname: 'file.txt',
            mimetype: 'text/plain',
            content: FileBuilder.content('bytes'),
          })
      ).toThrow();
    });
  });
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

  describe('content', () => {
    it('exposes content as non-optional', () => {
      const content = FileBuilder.content('attachment bytes');
      const file = new FileAttachment({
        id: 'id',
        entity: 'sharedId1',
        filename: 'file.txt',
        originalname: 'file.txt',
        mimetype: 'text/plain',
        content,
      });
      expect(file.content).toBe(content);
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
