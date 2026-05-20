import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { URLAttachmentDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
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

  describe('fromDBO', () => {
    it('should map all fields from the DBO', () => {
      const _id = new ObjectId();
      const dbo: URLAttachmentDBO = {
        _id,
        originalname: 'document.pdf',
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1000000000,
        type: 'attachment',
        entity: 'sharedId1',
        url: 'https://example.com/document.pdf',
      };

      const file = URLAttachment.fromDBO(dbo);

      expect(file).toBeInstanceOf(URLAttachment);
      expect(file.id).toBe(_id.toString());
      expect(file.originalname).toBe('document.pdf');
      expect(file.filename).toBe('document.pdf');
      expect(file.mimetype).toBe('application/pdf');
      expect(file.size).toBe(2048);
      expect(file.creationDate).toBe(1000000000);
      expect(file.entity).toBe('sharedId1');
      expect(file.url).toBe('https://example.com/document.pdf');
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
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });
  });
});
