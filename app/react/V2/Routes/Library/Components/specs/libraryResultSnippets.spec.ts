import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import {
  libraryResultViews,
  matchTypeCounts,
  visibleLibraryResults,
} from '../libraryResultSnippets.js';

const hit = (overrides: Partial<LibrarySearchHit> = {}): LibrarySearchHit => ({
  _id: '1',
  sharedId: 'case-1',
  title: 'Selvas Gómez',
  template: 'tpl-causa',
  language: 'es',
  creationDate: Date.UTC(2016, 0, 1),
  ...overrides,
});

const allTypes = { title: true, properties: true, document: true };

describe('libraryResultViews', () => {
  it('keeps the title out of the body and splits property and document hits', () => {
    const [view] = libraryResultViews([
      hit({
        snippets: {
          count: 3,
          metadata: [
            { field: 'title', texts: ['Selvas <b>Gómez</b>'] },
            { field: 'metadata.resumen.value', texts: ['la <b>protesta</b>'] },
          ],
          fullText: [{ text: 'víctimas <b>testigos</b>', page: 2 }],
        },
      }),
    ]);

    expect(view.titleHtml).toBe('Selvas <b>Gómez</b>');
    expect(view.properties).toEqual([
      { field: 'metadata.resumen.value', fieldKey: 'resumen', texts: ['la <b>protesta</b>'] },
    ]);
    expect(view.fullText).toEqual([{ text: 'víctimas <b>testigos</b>', page: 2 }]);
    expect(view.count).toBe(3);
    expect(view.year).toBe('2016');
    expect(view.hasTitle).toBe(true);
    expect(view.hasProperties).toBe(true);
    expect(view.hasDocument).toBe(true);
  });

  it('uses the plain title when the search did not mark it', () => {
    const [view] = libraryResultViews([
      hit({
        snippets: {
          count: 1,
          metadata: [{ field: 'metadata.resumen.value', texts: ['la <b>protesta</b>'] }],
          fullText: [],
        },
      }),
    ]);

    expect(view.titleHtml).toBe('Selvas Gómez');
    expect(view.hasTitle).toBe(false);
    expect(view.properties).toHaveLength(1);
  });

  it('drops rows that have no snippets', () => {
    expect(
      libraryResultViews([hit(), hit({ snippets: { count: 0, metadata: [], fullText: [] } })])
    ).toEqual([]);
  });
});

describe('matchTypeCounts', () => {
  it('counts loaded entities per category before the chips narrow them', () => {
    const views = libraryResultViews([
      hit({
        sharedId: 'title-only',
        snippets: {
          count: 1,
          metadata: [{ field: 'title', texts: ['<b>test</b>'] }],
          fullText: [],
        },
      }),
      hit({
        sharedId: 'property',
        _id: '2',
        snippets: {
          count: 1,
          metadata: [{ field: 'metadata.resumen.value', texts: ['<b>test</b>'] }],
          fullText: [],
        },
      }),
      hit({
        sharedId: 'document',
        _id: '3',
        snippets: {
          count: 1,
          metadata: [],
          fullText: [{ text: '<b>test</b>', page: 1 }],
        },
      }),
    ]);

    expect(matchTypeCounts(views)).toEqual({ title: 1, properties: 1, document: 1 });
  });
});

describe('visibleLibraryResults', () => {
  const views = libraryResultViews([
    hit({
      sharedId: 'both',
      snippets: {
        count: 2,
        metadata: [{ field: 'metadata.resumen.value', texts: ['<b>test</b>'] }],
        fullText: [{ text: '<b>test</b>', page: 4 }],
      },
    }),
    hit({
      sharedId: 'title-only',
      _id: '2',
      snippets: {
        count: 1,
        metadata: [{ field: 'title', texts: ['<b>test</b>'] }],
        fullText: [],
      },
    }),
  ]);

  it('hides entities and sections the chips turn off', () => {
    const visible = visibleLibraryResults(views, {
      title: false,
      properties: false,
      document: true,
    });

    expect(visible.map(view => view.sharedId)).toEqual(['both']);
    expect(visible[0].properties).toEqual([]);
    expect(visible[0].fullText).toHaveLength(1);
  });

  it('keeps a title-only card when the title chip is on', () => {
    const visible = visibleLibraryResults(views, {
      ...allTypes,
      properties: false,
      document: false,
    });

    expect(visible.map(view => view.sharedId)).toEqual(['title-only']);
    expect(visible[0].properties).toEqual([]);
    expect(visible[0].fullText).toEqual([]);
  });
});
