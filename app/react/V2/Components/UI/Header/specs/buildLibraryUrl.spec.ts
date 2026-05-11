import Immutable from 'immutable';
import { libraryViewInfo } from '#app/App/libraryViewInfo.js';
import { processFilters, encodeSearch } from '#app/Library/actions/libraryActions.js';
import { IStore } from '#app/istore.js';
import { buildLibraryUrl } from '#V2/Components/UI/Header/buildLibraryUrl.js';

const emptyFilters: IStore['library']['filters'] = Immutable.fromJS({
  properties: [],
  documentTypes: [],
});

const expectedPath = (options: {
  view: keyof typeof libraryViewInfo;
  librarySearch: Record<string, unknown>;
  searchTerm: string;
}) => {
  const next = processFilters(options.librarySearch, emptyFilters.toJS());
  next.searchTerm = options.searchTerm;
  return `/${libraryViewInfo[options.view].url}/${encodeSearch(next)}`;
};

describe('buildLibraryUrl', () => {
  it('matches Menu: Redux search/filters and searchTerm from location q', () => {
    const librarySearch = { sort: 'asc' };
    const path = buildLibraryUrl({
      location: { search: '?q=(searchTerm:%27asd%27)' },
      librarySearch,
      libraryFilters: emptyFilters,
      defaultLibraryView: 'cards',
    });
    expect(path).toBe(expectedPath({ view: 'cards', librarySearch, searchTerm: 'asd' }));
  });

  it('uses defaultLibraryView table', () => {
    const librarySearch = { sort: 'desc' };
    const path = buildLibraryUrl({
      location: { search: '' },
      librarySearch,
      libraryFilters: emptyFilters,
      defaultLibraryView: 'table',
    });
    expect(path).toBe(expectedPath({ view: 'table', librarySearch, searchTerm: '' }));
  });

  it('uses cards when defaultLibraryView is missing or unknown', () => {
    const path = buildLibraryUrl({
      location: { search: '' },
      librarySearch: {},
      libraryFilters: emptyFilters,
      defaultLibraryView: undefined,
    });
    expect(path.startsWith('/library/')).toBe(true);
  });
});
