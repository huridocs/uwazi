import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { URLAttachment } from '../URLAttachment.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('URLAttachment', () => {
  describe('toDTO', () => {
    it('should include all base and specialized properties', () => {
      const id = f.idString('att');
      const file = FileBuilder.urlAttachment(id, {
        originalname: 'document.pdf',
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1000000000,
        entity: 'sharedId1',
        url: 'https://example.com/document.pdf',
      });

      expect(file.toDTO()).toEqual({
        _id: id,
        originalname: 'document.pdf',
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1000000000,
        entity: 'sharedId1',
        url: 'https://example.com/document.pdf',
        type: 'attachment',
      });
    });
  });

  describe('update', () => {
    it('should rename and preserve all properties', () => {
      const file = FileBuilder.urlAttachment(f.idString('att'), {
        originalname: 'original.pdf',
        entity: 'sharedId1',
        url: 'https://example.com/doc.pdf',
      });
      const updated = file.update({ originalname: 'renamed.pdf' });

      expect(updated).toBeInstanceOf(URLAttachment);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'renamed.pdf' });
      expect(updated.content).toBeUndefined();
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });
  });

  describe('content', () => {
    it('should always be undefined even if passing content on the constructor', async () => {
      expect(FileBuilder.urlAttachment('attachment_id').content).toBeUndefined();
      expect(
        FileBuilder.urlAttachment('attachment_id', {
          //@ts-ignore
          content: FileBuilder.content('content'),
        }).content
      ).toBeUndefined();
    });
  });
});
