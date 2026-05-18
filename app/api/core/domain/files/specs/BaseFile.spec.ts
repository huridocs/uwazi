import { FileAttachment } from '../FileAttachment.js';
import { CustomUpload } from '../CustomUpload.js';
import { FileContents } from '../FileContents.js';
import { ProcessingPDF } from '../ProcessingPDF.js';
import { Thumbnail } from '../Thumbnail.js';
import { URLAttachment } from '../URLAttachment.js';

describe('BaseFile', () => {
  const validFileProps = {
    id: 'file123',
    originalname: 'document.pdf',
    filename: 'doc_abc123.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    creationDate: 1234567890,
    entity: 'entity1',
    // eslint-disable-next-line func-names
    content: new FileContents(async function* () {
      yield Buffer.from('test');
    } as any),
  };

  describe('validation', () => {
    describe('id field', () => {
      it('should accept valid id', () => {
        expect(() => new FileAttachment(validFileProps)).not.toThrow();
      });

      it('should reject empty id', () => {
        expect(() => new FileAttachment({ ...validFileProps, id: '' })).toThrow(
          'File ID is required'
        );
      });
    });

    describe('originalname field', () => {
      it('should accept valid originalname', () => {
        const file = new FileAttachment({ ...validFileProps, originalname: 'my-file.txt' });
        expect(file.originalname).toBe('my-file.txt');
      });

      it('should reject empty originalname', () => {
        expect(() => new FileAttachment({ ...validFileProps, originalname: '' })).toThrow(
          'Original filename is required'
        );
      });

      it('should reject originalname that is too long', () => {
        expect(
          () => new FileAttachment({ ...validFileProps, originalname: 'a'.repeat(256) })
        ).toThrow('Original filename is too long');
      });

      it('should sanitize path traversal attempts in originalname', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: '..\\..\\etc\\passwd',
        });
        expect(file.originalname).toBe('etcpasswd');
      });

      it('should remove null bytes from originalname', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: 'file\x00name.txt',
        });
        expect(file.originalname).toBe('filename.txt');
      });

      it('should remove path separators from originalname', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: 'path/to/file.txt',
        });
        expect(file.originalname).toBe('pathtofile.txt');
      });

      it('should fully sanitize multiple dots before path separators', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: '....//file.txt',
        });
        expect(file.originalname).toBe('file.txt');
      });

      it('should fully sanitize interleaved traversal patterns', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: '..././file.txt',
        });
        expect(file.originalname).toBe('file.txt');
      });

      it('should fully sanitize triple dots with backslash', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: '...\\file.txt',
        });
        expect(file.originalname).toBe('file.txt');
      });

      it('should handle complex nested traversal attempts', () => {
        const file = new FileAttachment({
          ...validFileProps,
          originalname: '..../.././etc/passwd',
        });
        expect(file.originalname).toBe('etcpasswd');
      });
    });

    describe('filename field', () => {
      it('should accept valid filename', () => {
        const file = new FileAttachment({ ...validFileProps, filename: 'generated_123.pdf' });
        expect(file.filename).toBe('generated_123.pdf');
      });

      it('should reject empty filename', () => {
        expect(() => new FileAttachment({ ...validFileProps, filename: '' })).toThrow(
          'Filename is required'
        );
      });

      it('should reject filename that is too long', () => {
        expect(() => new FileAttachment({ ...validFileProps, filename: 'a'.repeat(256) })).toThrow(
          'Filename is too long'
        );
      });

      it('should sanitize path traversal in filename', () => {
        const file = new FileAttachment({
          ...validFileProps,
          filename: '..\\malicious.exe',
        });
        expect(file.filename).toBe('malicious.exe');
      });

      it('should remove path separators from filename', () => {
        const file = new FileAttachment({
          ...validFileProps,
          filename: 'folder\\file.txt',
        });
        expect(file.filename).toBe('folderfile.txt');
      });

      it('should fully sanitize multiple dots in filename', () => {
        const file = new FileAttachment({
          ...validFileProps,
          filename: '....//generated.pdf',
        });
        expect(file.filename).toBe('generated.pdf');
      });
    });

    describe('mimetype field', () => {
      it('should accept valid mime types', () => {
        const validMimeTypes = [
          'application/pdf',
          'image/png',
          'text/plain',
          'video/mp4',
          'application/vnd.ms-excel',
          'application/x-custom+xml',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/html',
          'text/html; charset=utf-8',
        ];

        validMimeTypes.forEach(mimetype => {
          const file = new FileAttachment({ ...validFileProps, mimetype });
          expect(file.mimetype).toBe(mimetype);
        });
      });

      it('should reject empty mimetype', () => {
        expect(() => new FileAttachment({ ...validFileProps, mimetype: '' })).toThrow(
          'MIME type is required'
        );
      });

      it('should reject invalid mimetype format (no slash)', () => {
        expect(() => new FileAttachment({ ...validFileProps, mimetype: 'applicationpdf' })).toThrow(
          'Invalid MIME type format'
        );
      });

      it('should reject invalid mimetype format (starts with slash)', () => {
        expect(() => new FileAttachment({ ...validFileProps, mimetype: '/pdf' })).toThrow(
          'Invalid MIME type format'
        );
      });

      it('should reject invalid mimetype format (ends with slash)', () => {
        expect(() => new FileAttachment({ ...validFileProps, mimetype: 'application/' })).toThrow(
          'Invalid MIME type format'
        );
      });

      it('should reject mimetype with invalid characters', () => {
        expect(
          () => new FileAttachment({ ...validFileProps, mimetype: 'application/pdf;malicious' })
        ).toThrow('Invalid MIME type format');
      });
    });

    describe('size field', () => {
      it('should accept valid positive size', () => {
        const file = new FileAttachment({ ...validFileProps, size: 12345 });
        expect(file.size).toBe(12345);
      });

      it('should reject non-integer size', () => {
        expect(() => new FileAttachment({ ...validFileProps, size: 123.45 })).toThrow(
          'File size must be an integer'
        );
      });
    });

    describe('creationDate field', () => {
      it('should accept valid timestamp', () => {
        const timestamp = Date.now();
        const file = new FileAttachment({ ...validFileProps, creationDate: timestamp });
        expect(file.creationDate).toBe(timestamp);
      });
      it('should reject non-integer timestamp', () => {
        expect(() => new FileAttachment({ ...validFileProps, creationDate: 123.456 })).toThrow(
          'Creation date must be an integer'
        );
      });
    });

    describe('entity field', () => {
      it('should accept valid entity id', () => {
        const file = new FileAttachment({ ...validFileProps, entity: 'entity123' });
        expect(file.entity).toBe('entity123');
      });

      it('should accept undefined entity for classes that do not require it', () => {
        const { entity, ...propsWithoutEntity } = validFileProps;
        const file = new CustomUpload(propsWithoutEntity);
        expect(file.entity).toBeUndefined();
      });

      it('should reject empty entity string', () => {
        expect(() => new CustomUpload({ ...validFileProps, entity: '' } as any)).toThrow(
          'Entity ID must not be empty'
        );
      });
    });

    describe('optional fields', () => {
      it('should accept undefined uploaded field', () => {
        const file = new FileAttachment(validFileProps);
        expect(file.uploaded).toBeUndefined();
      });

      it('should accept boolean uploaded field', () => {
        const file = new FileAttachment({ ...validFileProps, uploaded: true });
        expect(file.uploaded).toBe(true);
      });

      it('should accept undefined content field', () => {
        const { content, ...propsWithoutContent } = validFileProps;
        const file = new FileAttachment(propsWithoutContent as any);
        expect(file.content).toBeUndefined();
      });
    });
  });

  describe('update method', () => {
    it('should validate when updating originalname', () => {
      const file = new FileAttachment(validFileProps);

      expect(() => file.update({ originalname: '' })).toThrow('Original filename is required');
    });

    it('should sanitize when updating originalname', () => {
      const file = new FileAttachment(validFileProps);
      const updated = file.update({ originalname: '..\\..\\evil.exe' });

      expect(updated.originalname).toBe('evil.exe');
    });

    it('should preserve other fields when updating', () => {
      const file = new FileAttachment(validFileProps);
      const updated = file.update({ originalname: 'new-name.pdf' });

      expect(updated.originalname).toBe('new-name.pdf');
      expect(updated.id).toBe(file.id);
      expect(updated.filename).toBe(file.filename);
      expect(updated.mimetype).toBe(file.mimetype);
      expect(updated.size).toBe(file.size);
      expect(updated.entity).toBe(file.entity);
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters in filenames', () => {
      const file = new FileAttachment({
        ...validFileProps,
        originalname: 'documento-español-日本語.pdf',
      });
      expect(file.originalname).toBe('documento-español-日本語.pdf');
    });

    it('should handle filenames with multiple dots', () => {
      const file = new FileAttachment({
        ...validFileProps,
        originalname: 'my.file.name.tar.gz',
      });
      expect(file.originalname).toBe('my.file.name.tar.gz');
    });

    it('should handle very small files', () => {
      const file = new FileAttachment({ ...validFileProps, size: 1 });
      expect(file.size).toBe(1);
    });

    it('should handle very large files', () => {
      const largeSize = 10 * 1024 * 1024 * 1024; // 10GB
      const file = new FileAttachment({ ...validFileProps, size: largeSize });
      expect(file.size).toBe(largeSize);
    });
  });

  it('should fallback properties correctly in constructor', () => {
    const attachment = new FileAttachment({
      id: 'id',
      content: validFileProps.content,
      filename: 'filename',
      mimetype: 'application/pdf',
      entity: 'entity',

      size: undefined as any,
      creationDate: undefined as any,
      originalname: undefined as any,
    });

    const thumbnail = new Thumbnail({
      id: 'id',
      content: validFileProps.content,
      filename: 'filename',
      language: 'en',
      entity: 'entity',

      mimetype: undefined as any,
      size: undefined as any,
      creationDate: undefined as any,
      originalname: undefined as any,
    });

    const urlAttachment = new URLAttachment({
      id: 'id',
      entity: 'entity',
      url: 'http://example.com/file.pdf',
      mimetype: 'application/pdf',

      filename: undefined as any,
      size: undefined as any,
      creationDate: undefined as any,
      originalname: undefined as any,
    });

    expect(attachment).toMatchObject({
      size: 0,
      creationDate: 0,
      originalname: 'filename',
    });

    expect(thumbnail).toMatchObject({
      size: 0,
      creationDate: 0,
      originalname: 'filename',
      mimetype: 'image/jpeg',
    });

    expect(urlAttachment).toMatchObject({
      size: 0,
      creationDate: 0,
      originalname: 'http://example.com/file.pdf',
      filename: 'http://example.com/file.pdf',
    });
  });

  describe('hasChanged property', () => {
    const cases = [
      {
        name: 'FileAttachment',
        build: () => new FileAttachment(validFileProps),
        updatedName: 'changed.pdf',
        sameName: validFileProps.originalname,
      },
      {
        name: 'CustomUpload',
        build: () =>
          new CustomUpload({
            ...validFileProps,
            entity: undefined,
          } as any),
        updatedName: 'changed.txt',
        sameName: validFileProps.originalname,
      },
      {
        name: 'Thumbnail',
        build: () =>
          new Thumbnail({
            id: 'thumb1',
            filename: 'thumb.jpg',
            language: 'en',
            entity: 'entity1',
            content: validFileProps.content,
            mimetype: 'image/jpeg',
            size: 100,
            creationDate: 1234567890,
            originalname: 'thumb.jpg',
          }),
        updatedName: 'thumb-new.jpg',
        sameName: 'thumb.jpg',
      },
      {
        name: 'URLAttachment',
        build: () =>
          new URLAttachment({
            id: 'url1',
            entity: 'entity1',
            url: 'http://example.com/file.pdf',
            mimetype: 'application/pdf',
            filename: 'file.pdf',
            size: 10,
            creationDate: 1234567890,
            originalname: 'file.pdf',
          }),
        updatedName: 'file-updated.pdf',
        sameName: 'file.pdf',
      },
    ];

    describe.each(cases)('$name', ({ build, updatedName, sameName }) => {
      it('should be false before any update', () => {
        const file = build();
        expect(file.hasChanged).toBe(false);
      });

      it('should be true after update changes originalname', () => {
        const file = build();
        const updated = file.update({ originalname: updatedName });
        expect(updated.hasChanged).toBe(true);
      });

      it('should be false after update with same originalname', () => {
        const file = build();
        const updated = file.update({ originalname: sameName });
        expect(updated.hasChanged).toBe(false);
      });
    });
  });

  describe('update() — specialized field preservation', () => {
    describe('FileAttachment', () => {
      it('update({ originalname }) preserves entity', () => {
        const file = new FileAttachment(validFileProps);
        const updated = file.update({ originalname: 'new.pdf' });

        expect(updated).toBeInstanceOf(FileAttachment);
        expect(updated.entity).toBe(validFileProps.entity);
        expect(updated.originalname).toBe('new.pdf');
      });

      it('update({ language }) is silently ignored; entity preserved; hasChanged is false', () => {
        const file = new FileAttachment(validFileProps);
        const updated = file.update({ language: 'es' });

        expect(updated).toBeInstanceOf(FileAttachment);
        expect(updated.entity).toBe(validFileProps.entity);
        expect(updated.hasChanged).toBe(false);
      });

      it('update({}) returns a clone where hasChanged is false', () => {
        const file = new FileAttachment(validFileProps);
        expect(file.update({}).hasChanged).toBe(false);
      });

      it('previousVersion.originalname holds the old value after a rename', () => {
        const file = new FileAttachment(validFileProps);
        const updated = file.update({ originalname: 'new.pdf' });

        expect(updated.previousVersion?.originalname).toBe(validFileProps.originalname);
      });
    });

    describe('CustomUpload', () => {
      const customProps = { ...validFileProps, entity: undefined as any };

      it('update({ originalname }) returns a CustomUpload with updated name', () => {
        const file = new CustomUpload(customProps);
        const updated = file.update({ originalname: 'new.pdf' });

        expect(updated).toBeInstanceOf(CustomUpload);
        expect(updated.originalname).toBe('new.pdf');
      });

      it('update({ language }) is silently ignored; hasChanged is false', () => {
        const file = new CustomUpload(customProps);
        const updated = file.update({ language: 'es' });

        expect(updated).toBeInstanceOf(CustomUpload);
        expect(updated.hasChanged).toBe(false);
      });

      it('update({}) returns a clone where hasChanged is false', () => {
        const file = new CustomUpload(customProps);
        expect(file.update({}).hasChanged).toBe(false);
      });
    });

    describe('ProcessingPDF', () => {
      const processingProps = {
        ...validFileProps,
        entity: 'entity1',
        status: 'processing' as const,
      };

      it('update({ originalname }) preserves entity and status', () => {
        const file = new ProcessingPDF(processingProps);
        const updated = file.update({ originalname: 'new.pdf' });

        expect(updated).toBeInstanceOf(ProcessingPDF);
        expect(updated.entity).toBe(processingProps.entity);
        expect((updated as ProcessingPDF).status).toBe(processingProps.status);
        expect(updated.originalname).toBe('new.pdf');
      });

      it('update({ language }) is silently ignored; entity and status preserved; hasChanged is false', () => {
        const file = new ProcessingPDF(processingProps);
        const updated = file.update({ language: 'es' });

        expect(updated).toBeInstanceOf(ProcessingPDF);
        expect(updated.entity).toBe(processingProps.entity);
        expect((updated as ProcessingPDF).status).toBe(processingProps.status);
        expect(updated.hasChanged).toBe(false);
      });

      it('update({}) returns a clone where hasChanged is false', () => {
        const file = new ProcessingPDF(processingProps);
        expect(file.update({}).hasChanged).toBe(false);
      });
    });

    describe('URLAttachment', () => {
      const urlProps = {
        id: 'url1',
        entity: 'entity1',
        url: 'http://example.com/file.pdf',
        mimetype: 'application/pdf',
        filename: 'file.pdf',
        size: 10,
        creationDate: 1234567890,
        originalname: 'file.pdf',
      };

      it('update({ originalname }) returns a URLAttachment; url and entity are preserved', () => {
        const file = new URLAttachment(urlProps);
        const updated = file.update({ originalname: 'renamed.pdf' });

        expect(updated).toBeInstanceOf(URLAttachment);
        expect((updated as URLAttachment).url).toBe(urlProps.url);
        expect(updated.entity).toBe(urlProps.entity);
        expect(updated.originalname).toBe('renamed.pdf');
      });

      it('update({ language }) is silently ignored; url and entity preserved; hasChanged is false', () => {
        const file = new URLAttachment(urlProps);
        const updated = file.update({ language: 'es' });

        expect(updated).toBeInstanceOf(URLAttachment);
        expect((updated as URLAttachment).url).toBe(urlProps.url);
        expect(updated.entity).toBe(urlProps.entity);
        expect(updated.hasChanged).toBe(false);
      });

      it('update({}) returns a clone where hasChanged is false', () => {
        const file = new URLAttachment(urlProps);
        expect(file.update({}).hasChanged).toBe(false);
      });

      it('previousVersion.originalname holds the old value after a rename', () => {
        const file = new URLAttachment(urlProps);
        const updated = file.update({ originalname: 'renamed.pdf' });
        expect(updated.previousVersion?.originalname).toBe(urlProps.originalname);
      });
    });

    describe('Thumbnail', () => {
      const thumbProps = {
        id: 'thumb1',
        entity: 'entity1',
        language: 'en' as const,
        filename: 'thumb.jpg',
        originalname: 'thumb.jpg',
        mimetype: 'image/jpeg',
        size: 512,
        creationDate: 1234567890,
        content: validFileProps.content,
      };

      it('update({ originalname }) returns a Thumbnail; entity, language, and content are preserved', () => {
        const file = new Thumbnail(thumbProps);
        const updated = file.update({ originalname: 'new-thumb.jpg' });

        expect(updated).toBeInstanceOf(Thumbnail);
        expect(updated.entity).toBe(thumbProps.entity);
        expect((updated as Thumbnail).language).toBe(thumbProps.language);
        expect(updated.content).toBe(thumbProps.content);
        expect(updated.originalname).toBe('new-thumb.jpg');
      });

      it('update({ language }) applies the new language; entity and content are preserved', () => {
        const file = new Thumbnail(thumbProps);
        const updated = file.update({ language: 'es' });

        expect(updated).toBeInstanceOf(Thumbnail);
        expect(updated.entity).toBe(thumbProps.entity);
        expect((updated as Thumbnail).language).toBe('es');
        expect(updated.content).toBe(thumbProps.content);
        expect(updated.hasChanged).toBe(true);
      });

      it('update({}) returns a clone where hasChanged is false', () => {
        const file = new Thumbnail(thumbProps);
        expect(file.update({}).hasChanged).toBe(false);
      });

      it('previousVersion.originalname holds the old value after a rename', () => {
        const file = new Thumbnail(thumbProps);
        const updated = file.update({ originalname: 'new-thumb.jpg' });
        expect(updated.previousVersion?.originalname).toBe(thumbProps.originalname);
      });
    });
  });
});
