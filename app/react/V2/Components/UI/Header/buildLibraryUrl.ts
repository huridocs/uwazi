import type { Location } from 'react-router';
import { libraryViewInfo } from '#app/App/libraryViewInfo.js';
import { IStore } from '#app/istore.js';
import { processFilters, encodeSearch } from '#app/Library/actions/libraryActions.js';
import { searchParamsFromLocationSearch } from '#app/utils/routeHelpers.js';

const isLibraryView = (value: string | undefined): value is keyof typeof libraryViewInfo =>
  typeof value === 'string' && value in libraryViewInfo;

function buildLibraryUrl(input: {
  location: Pick<Location, 'search'>;
  librarySearch: IStore['library']['search'];
  libraryFilters: IStore['library']['filters'];
  defaultLibraryView: string | undefined;
}): string {
  const resolved = isLibraryView(input.defaultLibraryView) ? input.defaultLibraryView : 'cards';
  const raw = searchParamsFromLocationSearch(input.location, 'q');
  const searchTerm =
    raw && typeof raw === 'object' && 'searchTerm' in raw && typeof raw.searchTerm === 'string'
      ? raw.searchTerm
      : '';
  const newParams = processFilters(input.librarySearch, input.libraryFilters.toJS());
  newParams.searchTerm = searchTerm;
  return `/${libraryViewInfo[resolved].url}/${encodeSearch(newParams)}`;
}

export { buildLibraryUrl };
