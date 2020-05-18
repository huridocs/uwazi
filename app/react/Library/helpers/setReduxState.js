import { wrapDispatch } from 'app/Multireducer';
import { addDocuments, initializeFiltersForm } from 'app/Library/actions/libraryActions';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';

export default function setReduxState(state) {
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

    dispatch(addDocuments(state.library.documents));
    dispatch(actions.set('library.markers', state.library.markers));
  };
}
