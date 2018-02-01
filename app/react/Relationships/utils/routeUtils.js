// TEST!!!
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import referencesAPI from 'app/Viewer/referencesAPI';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

function requestState(entityId, templates) {
  return referencesAPI.getGroupedByConnection(entityId)
  .then(connectionsGroups => {
    const filteredTemplates = connectionsGroups.reduce((templateIds, group) => {
      return templateIds.concat(group.templates.map(t => t._id.toString()));
    }, []);

    const sortOptions = prioritySortingCriteria({currentCriteria: {}, filteredTemplates, templates});

    return Promise.all([connectionsGroups, referencesAPI.search(entityId, sortOptions), sortOptions]);
  });
}

function emptyState() {
  return (dispatch) => {
    dispatch(actions.unset('relationships/list/entityId'));
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
  return (dispatch) => {
    dispatch(actions.set('relationships/list/entityId', state.relationships.list.entityId));
    dispatch(actions.set('relationships/list/entity', state.relationships.list.entity));
    dispatch(actions.set('relationships/list/connectionsGroups', state.relationships.list.connectionsGroups));
    dispatch(actions.set('relationships/list/searchResults', state.relationships.list.searchResults));
    dispatch(actions.set('relationships/list/filters', state.relationships.list.filters));
    dispatch(formActions.merge('relationships/list.sort', state.relationships.list.sort));
    dispatch(actions.set('relationships/list/view', state.relationships.list.view));
  };
}

export {
  requestState,
  emptyState,
  setReduxState
};
