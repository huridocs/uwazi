import { actions } from '#app/BasicReducer/index.js';
import { getAndSelectDocument } from '#app/Library/actions/libraryActions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { store } from '#app/store.js';

type SidePanelTab =
  | 'metadata'
  | 'references'
  | 'relationships'
  | 'semantic-search-results'
  | 'text-search'
  | 'toc';

const openEntitySidePanel = (sharedId: string, tab?: SidePanelTab) => {
  if (!store || !sharedId) {
    return;
  }

  try {
    const dispatch = wrapDispatch(store.dispatch, 'library');
    dispatch(actions.set('library.sidepanel.view', 'library'));
    if (tab) {
      dispatch(actions.set('library.sidepanel.tab', tab));
    }
    const result = dispatch(getAndSelectDocument(sharedId));
    Promise.resolve(result).catch(() => undefined);
  } catch {}
};

export { openEntitySidePanel };
