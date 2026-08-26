import type { LibrarySearchResult } from '#shared/types/librarySearch.js';
import type { LibraryUrlState } from './libraryUrlState.js';

type LoaderResponse = LibrarySearchResult & {
  urlState: LibraryUrlState;
};

export type { LoaderResponse };
