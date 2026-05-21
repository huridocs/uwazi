import { ObjectId } from 'mongodb';
import { BaseFile, BaseFileProps } from '../BaseFile.js';
import { FileContents } from '../FileContents.js';

// Minimal concrete implementation to test BaseFile in isolation
type TestFileProps = BaseFileProps & { content?: FileContents; entity?: string };

class TestFile extends BaseFile<TestFileProps> {
  protected _type = 'custom' as const;

  constructor(props: TestFileProps) {
    super(props);
  }

  toDTO() {
    return {
      ...this.dtoBaseFields(),
      type: 'custom' as const,
    };
  }

  // Expose protected method for testing
  getDtoBaseFields() {
    return this.dtoBaseFields();
  }
}

const makeContent = () =>
  // eslint-disable-next-line func-names
  new FileContents(async function* () {
    yield Buffer.from('test');
  } as any);

const validProps: TestFileProps = {
  id: 'file123',
  originalname: 'document.pdf',
  filename: 'doc_abc123.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  creationDate: 1234567890,
  uploaded: true,
};

describe('BaseFile', () => {
  describe('constructor', () => {
    describe('property storage', () => {
      it('stores all provided properties', () => {
        const file = new TestFile({ ...validProps, uploaded: true });
        expect(file.id).toBe('file123');
        expect(file.originalname).toBe('document.pdf');
        expect(file.filename).toBe('doc_abc123.pdf');
        expect(file.mimetype).toBe('application/pdf');
        expect(file.size).toBe(1024);
        expect(file.creationDate).toBe(1234567890);
        expect(file.uploaded).toBe(true);
      });

      it('defaults size to 0 when not provided', () => {
        const file = new TestFile({ ...validProps, size: undefined });
        expect(file.size).toBe(0);
      });

      it('defaults creationDate to 0 when not provided', () => {
        const file = new TestFile({ ...validProps, creationDate: undefined });
        expect(file.creationDate).toBe(0);
      });

      it('defaults originalname to filename when originalname is not provided', () => {
        const { originalname: _orig, ...props } = validProps;
        const file = new TestFile(props as TestFileProps);
        expect(file.originalname).toBe(validProps.filename);
      });
    });

    describe('validation', () => {
      it.each<[string, Partial<BaseFileProps>]>([
        ['empty id', { id: '' }],
        ['empty originalname', { originalname: '' }],
        ['originalname too long', { originalname: 'a'.repeat(256) }],
        ['empty filename', { filename: '' }],
        ['filename too long', { filename: 'a'.repeat(256) }],
        ['empty mimetype', { mimetype: '' }],
        ['mimetype missing slash', { mimetype: 'applicationpdf' }],
        ['mimetype starts with slash', { mimetype: '/pdf' }],
        ['mimetype ends with slash', { mimetype: 'application/' }],
        ['mimetype with invalid semicolon format', { mimetype: 'application/pdf;malicious' }],
        ['non-integer size', { size: 123.45 }],
        ['non-integer creationDate', { creationDate: 123.456 }],
      ])('throws on %s', (_name, overrides) => {
        expect(() => new TestFile({ ...validProps, ...overrides })).toThrowErrorMatchingSnapshot();
      });
    });

    describe('filename sanitization', () => {
      it.each([
        ['path traversal with backslash', '..\\..\\etc\\passwd', 'etcpasswd'],
        ['forward slashes', 'path/to/file.txt', 'pathtofile.txt'],
        ['null bytes', 'file\x00name.txt', 'filename.txt'],
        ['multiple dots before separator', '....//file.txt', 'file.txt'],
        ['interleaved traversal pattern', '..././file.txt', 'file.txt'],
        ['triple dots with backslash', '...\\file.txt', 'file.txt'],
        ['complex nested traversal', '..../.././etc/passwd', 'etcpasswd'],
      ])('sanitizes originalname: %s', (_desc, input, expected) => {
        const file = new TestFile({ ...validProps, originalname: input });
        expect(file.originalname).toBe(expected);
      });

      it.each([
        ['path traversal with backslash', '..\\malicious.exe', 'malicious.exe'],
        ['backslash separator', 'folder\\file.txt', 'folderfile.txt'],
        ['multiple dots before separator', '....//generated.pdf', 'generated.pdf'],
      ])('sanitizes filename: %s', (_desc, input, expected) => {
        const file = new TestFile({ ...validProps, filename: input });
        expect(file.filename).toBe(expected);
      });

      it('preserves unicode characters', () => {
        const file = new TestFile({ ...validProps, originalname: 'documento-español-日本語.pdf' });
        expect(file.originalname).toBe('documento-español-日本語.pdf');
      });

      it('preserves multiple dots that are not path traversal', () => {
        const file = new TestFile({ ...validProps, originalname: 'my.file.name.tar.gz' });
        expect(file.originalname).toBe('my.file.name.tar.gz');
      });
    });
  });

  describe('type getter', () => {
    it('returns the concrete class _type', () => {
      const file = new TestFile(validProps);
      expect(file.type).toBe('custom');
    });
  });

  describe('update()', () => {
    it('returns a new instance with the updated property', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: 'new-name.pdf' });
      expect(updated).not.toBe(file);
      expect(updated.originalname).toBe('new-name.pdf');
    });

    it('preserves unchanged properties', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: 'new-name.pdf' });

      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'new-name.pdf' });
    });

    it('should only update allowed properties', () => {
      const file = new TestFile(validProps);

      const updated = file.update({
        originalname: 'new-name.pdf',
        id: 'not_allowed',
        creationDate: 9999,
        mimetype: 'not_allowed/pdf',
        size: 9999,
        filename: 'not_allowed.pdf',
        uploaded: false,
      });

      expect(updated.toDTO()).toEqual({ ...file.toDTO(), originalname: 'new-name.pdf' });
    });
  });

  describe('hasChanged', () => {
    it('is false before any update', () => {
      const file = new TestFile(validProps);
      expect(file.hasChanged).toBe(false);
    });

    it('is true after update changes a property', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: 'changed.pdf' });
      expect(updated.hasChanged).toBe(true);
    });

    it('is false after update with the same value', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: validProps.originalname });
      expect(updated.hasChanged).toBe(false);
    });
  });

  describe('previousVersion', () => {
    it('is undefined before any update', () => {
      const file = new TestFile(validProps);
      expect(file.previousVersion).toBeUndefined();
    });

    it('returns the state before the last update', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: 'changed.pdf' });
      expect(updated.previousVersion!.originalname).toBe(validProps.originalname);
    });

    it('does not chain further back than one update', () => {
      const file = new TestFile(validProps);
      const updated = file.update({ originalname: 'changed.pdf' });
      expect(updated.previousVersion!.previousVersion).toBeUndefined();
    });
  });

  describe('isEntityFile()', () => {
    it('returns true when entity is set', () => {
      const file = new TestFile({ ...validProps, entity: 'sharedId1' });
      expect(file.isEntityFile()).toBe(true);
    });

    it('returns false when entity is undefined', () => {
      const file = new TestFile(validProps);
      expect(file.isEntityFile()).toBe(false);
    });
  });

  describe('hasContent()', () => {
    it('returns true when content is set', () => {
      const file = new TestFile({ ...validProps, content: makeContent() });
      expect(file.hasContent()).toBe(true);
    });

    it('returns false when content is undefined', () => {
      const file = new TestFile(validProps);
      expect(file.hasContent()).toBe(false);
    });
  });

  describe('dtoBaseFields()', () => {
    it('returns an object with all base DTO fields', () => {
      const file = new TestFile(validProps);
      expect(file.getDtoBaseFields()).toEqual({
        _id: 'file123',
        originalname: 'document.pdf',
        filename: 'doc_abc123.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1234567890,
      });
    });
  });

  describe('dboCommonFields()', () => {
    it('maps DBO fields to domain fields', () => {
      const _id = new ObjectId();
      const dbo = {
        _id,
        originalname: 'doc.pdf',
        filename: 'doc_abc.pdf',
        mimetype: 'application/pdf',
        size: 512,
        creationDate: 9999,
        type: 'custom' as const,
      };
      expect(BaseFile.dboCommonFields(dbo as any)).toEqual({
        id: _id.toString(),
        originalname: 'doc.pdf',
        filename: 'doc_abc.pdf',
        mimetype: 'application/pdf',
        size: 512,
        creationDate: 9999,
      });
    });
  });
});
