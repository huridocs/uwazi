import type { LibrarySearchResult } from '#V2/api/librarySearch.js';
import type { LibraryUrlState } from './libraryUrlState.js';

type LoaderResponse = LibrarySearchResult & {
  urlState: LibraryUrlState;
};

export type { LoaderResponse };
