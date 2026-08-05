import { sanitizeForJsonb, FilesMigrationConfig } from '../FilesMigrationConfig.js';

describe('sanitizeForJsonb', () => {
  it('strips null bytes with surrounding whitespace preserved', () => {
    expect(sanitizeForJsonb('hello \u0000 world')).toBe('hello  world');
    expect(sanitizeForJsonb('a\u0000\u0000b')).toBe('ab');
    expect(sanitizeForJsonb('\u0000start')).toBe('start');
    expect(sanitizeForJsonb('end\u0000')).toBe('end');
  });

  it('strips multiple adjacent bad characters', () => {
    expect(sanitizeForJsonb('a \u0008 \u001D \u007F \u0080 \u009F \uFFFD b')).toBe('a       b');
  });

  it('preserves newlines while stripping bad chars on the same line', () => {
    expect(sanitizeForJsonb('line1\u0000\nline2\u001D\nline3')).toBe('line1\nline2\nline3');
  });

  it('preserves spaces around stripped bad chars in Arabic text', () => {
    const dirty = 'القانون \u0000 رقم \u001D ٦٢';
    expect(sanitizeForJsonb(dirty)).toBe('القانون  رقم  ٦٢');
  });

  it('strips backspace (U+0008)', () => {
    expect(sanitizeForJsonb('a\u0008b')).toBe('ab');
  });

  it('strips group separator (U+001D)', () => {
    expect(sanitizeForJsonb('a\u001Db')).toBe('ab');
  });

  it('strips DEL (U+007F)', () => {
    expect(sanitizeForJsonb('a\u007Fb')).toBe('ab');
  });

  it('strips C1 controls (U+0080–U+009F)', () => {
    expect(sanitizeForJsonb('a\u0080\u009Fb')).toBe('ab');
  });

  it('strips replacement character (U+FFFD)', () => {
    expect(sanitizeForJsonb('a\uFFFDb')).toBe('ab');
  });

  it('preserves tab (U+0009)', () => {
    expect(sanitizeForJsonb('a\tb')).toBe('a\tb');
  });

  it('preserves line feed (U+000A)', () => {
    expect(sanitizeForJsonb('a\nb')).toBe('a\nb');
  });

  it('preserves carriage return (U+000D)', () => {
    expect(sanitizeForJsonb('a\rb')).toBe('a\rb');
  });

  it('preserves ASCII printable characters', () => {
    const ascii =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;\':",./<>?';
    expect(sanitizeForJsonb(ascii)).toBe(ascii);
  });

  it('preserves Arabic text', () => {
    const arabic = 'القانون رقم ٦٢ رئيس الجمهورية';
    expect(sanitizeForJsonb(arabic)).toBe(arabic);
  });

  it('preserves bidirectional marks (LRM, RLM, LRE, RLE, PDF, LRO, RLO)', () => {
    const bidi = '\u200E\u200F\u202A\u202B\u202C\u202D\u202E';
    expect(sanitizeForJsonb(bidi)).toBe(bidi);
  });

  it('preserves zero-width characters (ZWSP, ZWNJ, ZWJ)', () => {
    const zw = '\u200B\u200C\u200D';
    expect(sanitizeForJsonb(zw)).toBe(zw);
  });

  it('preserves entity references like [[104]]', () => {
    const text =
      'القرارات[[104]] التي[[104]] تصدرها[[104]] السلطات[[104]] الإدارية[[104]] أو[[104]] البلدية[[104]] وفاقاً[[104]]';
    expect(sanitizeForJsonb(text)).toBe(text);
  });

  it('sanitizes a real-world mixed string: Arabic + bidi + entity refs + PDF artifacts', () => {
    const dirty =
      '‫القانون[[1]] رقم[[1]] \u0000\u001D\u0008\u007F\u0080\u009F\uFFFD‪/[[1]] 62[[1]] /‬‬[[1]]\n' +
      '‫رئيس[[1]] الجمهورية‬[[1]]\n' +
      '\u202A\u202B\u202C'; // bidi marks should stay

    const clean =
      '‫القانون[[1]] رقم[[1]] ‪/[[1]] 62[[1]] /‬‬[[1]]\n' +
      '‫رئيس[[1]] الجمهورية‬[[1]]\n' +
      '\u202A\u202B\u202C';

    expect(sanitizeForJsonb(dirty)).toBe(clean);
  });

  it('recursively sanitizes nested objects', () => {
    const dirty = {
      1: 'page\u00001',
      2: 'page\u001D2',
    };
    const clean = {
      1: 'page1',
      2: 'page2',
    };
    expect(sanitizeForJsonb(dirty)).toEqual(clean);
  });

  it('recursively sanitizes arrays', () => {
    const dirty = ['a\u0000b', 'c\uFFFDd'];
    expect(sanitizeForJsonb(dirty)).toEqual(['ab', 'cd']);
  });

  it('passes through numbers, booleans, null unchanged', () => {
    expect(sanitizeForJsonb(42)).toBe(42);
    expect(sanitizeForJsonb(true)).toBe(true);
    expect(sanitizeForJsonb(null)).toBe(null);
  });

  it('sanitizes deep nesting: array of objects with strings', () => {
    const dirty = [
      { label: 'Article\u0000 1', page: '1' },
      { label: 'Article\u001D 2', page: '2' },
    ];
    const clean = [
      { label: 'Article 1', page: '1' },
      { label: 'Article 2', page: '2' },
    ];
    expect(sanitizeForJsonb(dirty)).toEqual(clean);
  });

  it('handles empty string', () => {
    expect(sanitizeForJsonb('')).toBe('');
  });

  it('handles string with only bad chars', () => {
    expect(sanitizeForJsonb('\u0000\u0008\u001D\u007F\uFFFD')).toBe('');
  });
});

describe('FilesMigrationConfig.mapDocument', () => {
  it('sanitizes fullText, propertySelections, and toc in one pass', () => {
    const doc = {
      _id: 'abc123',
      creationDate: 1234567890,
      filename: 'test.pdf',
      mimetype: 'application/pdf',
      originalname: 'test.pdf',
      size: 1024,
      type: 'document' as const,
      entity: 'ent1',
      status: 'ready' as const,
      language: 'arb',
      totalPages: 2,
      generatedToc: true,
      fullText: {
        1: 'page\u00001\u001Dcontent',
        2: 'page\uFFFD2',
      },
      propertySelections: [{ propertyName: 'title\u0000', text: 'hello\u001D' }],
      toc: [
        {
          label: 'Intro\u0000',
          indentation: 0,
          selectionRectangles: [],
        },
      ],
      url: null,
    };

    const row = FilesMigrationConfig.mapDocument(doc as any);

    expect(row.fullText).toEqual({
      1: 'page1content',
      2: 'page2',
    });
    expect(row.propertySelections).toEqual([{ propertyName: 'title', text: 'hello' }]);
    expect(row.toc).toEqual([
      {
        label: 'Intro',
        indentation: 0,
        selectionRectangles: [],
      },
    ]);
  });
});
