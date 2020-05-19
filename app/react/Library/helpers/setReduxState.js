import { wrapDispatch } from 'app/Multireducer';
import {
  addDocuments,
  setDocuments,
  initializeFiltersForm,
} from 'app/Library/actions/libraryActions';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';

export default function setReduxState(state, addinsteadOfSet) {
  return _dispatch => {
    const dispatch = wrapDispatch(_dispatch, 'library');
    dispatch(formActions.load('library.search', state.library.search));

    dispatch(
      initializeFiltersForm({
        documentTypes: state.library.filters.documentTypes,
        libraryFilters: state.library.filters.properties,
        aggregations: state.library.aggregations,
      })
    );

    dispatch(
      addinsteadOfSet
        ? addDocuments(state.library.documents)
        : setDocuments(state.library.documents)
    );
    dispatch(actions.set('library.markers', state.library.markers));
  };
}
