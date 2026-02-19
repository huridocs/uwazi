// TEST!!!
import { fromJS } from 'immutable';
import { actions as formActions } from 'react-redux-form';

import { actions } from 'app/BasicReducer';
import { actions as connectionsListActions } from 'app/ConnectionsList';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import referencesAPI from 'app/Viewer/referencesAPI';

function requestState(requestParams, state) {
  const relStateStart = performance.now();

  const getGroupedStart = performance.now();
  return referencesAPI.getGroupedByConnection(requestParams).then(connectionsGroups => {
    console.log(
      '[PERF][Relationships] getGroupedByConnection API:',
      (performance.now() - getGroupedStart).toFixed(2),
      'ms'
    );

    const processingStart = performance.now();
    const filteredTemplates = connectionsGroups.reduce(
      (templateIds, group) => templateIds.concat(group.templates.map(t => t._id.toString())),
      []
    );

    const sortOptions = prioritySortingCriteria.get({
      currentCriteria: {},
      filteredTemplates,
      templates: state.templates,
    });
    const params = state.relationships ? state.relationships.list : {};
    params.sort = params.sort || sortOptions;
    params.filters = fromJS({ limit: 10 });
    params.sharedId = requestParams.data.sharedId;
    const newParams = requestParams.add(params);
    console.log(
      '[PERF][Relationships] Data processing (template filtering, sort options):',
      (performance.now() - processingStart).toFixed(2),
      'ms'
    );

    const searchStart = performance.now();
    return Promise.all([
      connectionsGroups,
      connectionsListActions.search(newParams),
      params.sort,
      params.filters,
    ]).then(result => {
      console.log(
        '[PERF][Relationships] connectionsListActions.search:',
        (performance.now() - searchStart).toFixed(2),
        'ms'
      );
      console.log(
        '[PERF][Relationships] TOTAL requestState:',
        (performance.now() - relStateStart).toFixed(2),
        'ms'
      );
      return result;
    });
  });
}

function emptyState() {
  return dispatch => {
    dispatch(actions.unset('relationships/list/sharedId'));
    dispatch(actions.unset('relationships/list/entity'));
    dispatch(actions.unset('relationships/list/connectionsGroups'));
    dispatch(actions.unset('relationships/list/searchResults'));
    dispatch(actions.unset('relationships/list/filters'));
    dispatch(actions.unset('relationships/list.sort'));
    dispatch(actions.unset('relationships/list/view'));

    dispatch(actions.set('relationships/connection', {}));
  };
}

function setReduxState(state) {
  return dispatch => {
    dispatch(actions.set('relationships/list/sharedId', state.relationships.list.sharedId));
    dispatch(actions.set('relationships/list/entity', state.relationships.list.entity));
    dispatch(
      actions.set(
        'relationships/list/connectionsGroups',
        state.relationships.list.connectionsGroups
      )
    );
    dispatch(
      actions.set('relationships/list/searchResults', state.relationships.list.searchResults)
    );
    dispatch(actions.set('relationships/list/filters', state.relationships.list.filters));
    dispatch(formActions.merge('relationships/list.sort', state.relationships.list.sort));
    dispatch(actions.set('relationships/list/view', state.relationships.list.view));
  };
}

export { requestState, emptyState, setReduxState };
