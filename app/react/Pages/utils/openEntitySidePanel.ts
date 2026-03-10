import { actions } from 'app/BasicReducer';
import { getAndSelectDocument } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import { store } from 'app/store';

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
