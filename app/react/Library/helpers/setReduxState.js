import { wrapDispatch } from '#app/Multireducer/index.js';
import {
  addDocuments,
  setDocuments,
  initializeFiltersForm,
} from '#app/Library/actions/libraryActions.js';
import { actions as formActions } from 'react-redux-form';
import { actions } from '#app/BasicReducer/index.js';

export default function setReduxState(state, key, addinsteadOfSet) {
  return _dispatch => {
    const dispatch = wrapDispatch(_dispatch, key);
    dispatch(formActions.load(`${key}.search`, state[key].search));

    dispatch(
      initializeFiltersForm({
        documentTypes: state[key].filters.documentTypes,
        libraryFilters: state[key].filters.properties,
        aggregations: state[key].aggregations,
      })
    );

    dispatch(
      addinsteadOfSet ? addDocuments(state[key].documents) : setDocuments(state[key].documents)
    );

    if (key === 'library') {
      dispatch(actions.set('library.markers', state[key].markers));
    }
  };
}
