import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { URLAttachment } from '../URLAttachment.js';
import { FileBuilder } from './FileBuilder.js';

const f = getFixturesFactory();

describe('URLAttachment', () => {
  it('should fallback filename and originalname to url if not provided', () => {
    const file = new URLAttachment({
      id: 'id',
      entity: 'sharedId1',
      url: 'https://example.com/document.pdf',
      mimetype: 'application/pdf',
    } as any);

    expect(file.filename).toBe('https://example.com/document.pdf');
    expect(file.originalname).toBe('https://example.com/document.pdf');
    expect(file.url).toBe('https://example.com/document.pdf');
  });

  it('should fallback filename and originalname to url if empty', () => {
    const file = new URLAttachment({
      id: 'id',
      entity: 'sharedId1',
      url: 'https://example.com/document.pdf',
      filename: '',
      originalname: '',
      mimetype: 'application/pdf',
    } as any);

    expect(file.filename).toBe('https://example.com/document.pdf');
    expect(file.originalname).toBe('https://example.com/document.pdf');
    expect(file.url).toBe('https://example.com/document.pdf');
  });

  describe('validation', () => {
    it('throws when entity is missing', () => {
      expect(
        () =>
          new URLAttachment({
            id: 'id',
            url: 'https://example.com/document.pdf',
            filename: 'document.pdf',
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
          } as any)
      ).toThrow();
    });

    it('throws when entity is empty', () => {
      expect(
        () =>
          new URLAttachment({
            id: 'id',
            entity: '  ',
            url: 'https://example.com/document.pdf',
            filename: 'document.pdf',
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
          })
      ).toThrow();
    });

    it('throws when url is not a valid URL', () => {
      expect(
        () =>
          new URLAttachment({
            id: 'id',
            entity: 'sharedId1',
            url: 'not-a-url',
            filename: 'not-a-url',
            originalname: 'not-a-url',
            mimetype: 'application/pdf',
          })
      ).toThrow();
    });
  });

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
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.originalname).toBe('original.pdf');
    });

    it('should change url', () => {
      const file = FileBuilder.urlAttachment(f.idString('att'), {
        originalname: 'original.pdf',
        entity: 'sharedId1',
        url: 'https://example.com/doc.pdf',
      });
      const updated = file.update({ url: 'http://changed.com' });

      expect(updated).toBeInstanceOf(URLAttachment);
      expect(updated.toDTO()).toEqual({ ...file.toDTO(), url: 'http://changed.com' });
      expect(updated.hasChanged).toBe(true);
      expect(updated.previousVersion?.url).toBe('https://example.com/doc.pdf');
    });
  });
});
