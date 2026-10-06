import { FileKind } from '../FileKind.js';

describe('FileKind', () => {
  describe('of()', () => {
    it.each([
      ['application/pdf', 'pdf'],
      ['image/png', 'image'],
      ['video/mp4', 'video'],
      ['audio/mpeg', 'audio'],
      ['text/csv', 'text'],
      ['application/msword', 'office'],
      ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'office'],
      ['application/vnd.ms-excel', 'office'],
      ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'office'],
      ['application/vnd.ms-powerpoint', 'office'],
      ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'office'],
      ['application/vnd.oasis.opendocument.text', 'office'],
      ['application/vnd.oasis.opendocument.spreadsheet', 'office'],
      ['application/vnd.oasis.opendocument.presentation', 'office'],
      ['application/zip', 'other'],
    ])('should classify %s as %s', (mimetype, kind) => {
      expect(FileKind.of(mimetype)).toBe(kind);
    });

    it.each([[null], [undefined], [''], ['   ']])(
      'should classify a missing mimetype (%p) as unknown',
      mimetype => {
        expect(FileKind.of(mimetype)).toBe('unknown');
      }
    );

    it('should ignore case and surrounding whitespace', () => {
      expect(FileKind.of('  Application/PDF ')).toBe('pdf');
      expect(FileKind.of('IMAGE/JPEG')).toBe('image');
    });
  });

  describe('empty()', () => {
    it('should have every kind at zero', () => {
      expect(FileKind.empty()).toEqual({
        pdf: { count: 0, size: 0 },
        image: { count: 0, size: 0 },
        video: { count: 0, size: 0 },
        audio: { count: 0, size: 0 },
        office: { count: 0, size: 0 },
        text: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
        unknown: { count: 0, size: 0 },
      });
    });

    it('should return a new object every time', () => {
      const first = FileKind.empty();
      first.pdf.count = 5;

      expect(FileKind.empty().pdf.count).toBe(0);
    });
  });

  describe('bucket()', () => {
    it('should add up the mimetypes that fall in the same kind', () => {
      const usage = FileKind.bucket([
        { mimetype: 'image/png', count: 2, size: 100 },
        { mimetype: 'image/jpeg', count: 3, size: 50 },
        { mimetype: 'application/pdf', count: 1, size: 1000 },
        { mimetype: null, count: 4, size: 0 },
      ]);

      expect(usage).toEqual({
        ...FileKind.empty(),
        image: { count: 5, size: 150 },
        pdf: { count: 1, size: 1000 },
        unknown: { count: 4, size: 0 },
      });
    });

    it('should report every kind at zero when there are no files', () => {
      expect(FileKind.bucket([])).toEqual(FileKind.empty());
    });
  });
});
