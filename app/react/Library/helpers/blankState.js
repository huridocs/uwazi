import { store } from 'app/store';

export default function blankState() {
  const state = store.getState();
  return !state.library.documents.get('rows').size &&
  !Object.keys(state.library.search.filters).length &&
  !state.library.search.searchTerm;
}
