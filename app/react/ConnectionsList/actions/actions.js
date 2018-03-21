import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import {notify} from 'app/Notifications';

import referencesAPI from 'app/Viewer/referencesAPI';
import {fromJS as Immutable} from 'immutable';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

import * as uiActions from 'app/Entities/actions/uiActions';

export function search(params) {
  const {entityId, sort, filters} = params;

  const searchTerm = params.search && params.search.searchTerm ? params.search.searchTerm.value : '';

  let options = Immutable(sort);
  if (filters) {
    options = filters.merge(sort).merge({searchTerm});
  }

  return referencesAPI.search(entityId, options.toJS());
}

export function searchReferences() {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    return search(relationshipsList)
    .then(results => {
      dispatch(actions.set('relationships/list/searchResults', results));
      dispatch(uiActions.showTab('connections'));
    });
  };
}

export function connectionsChanged() {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    const {entityId} = relationshipsList;

    return referencesAPI.getGroupedByConnection(entityId)
    .then(connectionsGroups => {
      const filteredTemplates = connectionsGroups.reduce((templateIds, group) => {
        return templateIds.concat(group.templates.map(t => t._id.toString()));
      }, []);

      const sortOptions = prioritySortingCriteria({currentCriteria: relationshipsList.sort, filteredTemplates, templates: getState().templates});
      return Promise.all([connectionsGroups, sortOptions]);
    })
    .then(([connectionsGroups, sort]) => {
      dispatch(actions.set('relationships/list/connectionsGroups', connectionsGroups));
      dispatch(formActions.merge('relationships/list.sort', sort));
      return searchReferences()(dispatch, getState);
    });
  };
}

export function deleteConnection(connection) {
  return function (dispatch, getState) {
    return referencesAPI.delete(connection)
    .then(() => {
      dispatch(notify('Connection deleted', 'success'));
      return connectionsChanged()(dispatch, getState);
    });
  };
}

export function loadAllReferences() {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    dispatch(actions.set('relationships/list/filters', relationshipsList.filters.set('limit', 9999)));
    return searchReferences()(dispatch, getState);
  };
}

export function loadMoreReferences(limit) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    dispatch(actions.set('relationships/list/filters', relationshipsList.filters.set('limit', limit)));
    return searchReferences()(dispatch, getState);
  };
}

export function setFilter(groupFilterValues) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    const currentFilter = relationshipsList.filters.get('filter') || Immutable({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(actions.set('relationships/list/filters', relationshipsList.filters.set('filter', newFilter)));
    return searchReferences()(dispatch, getState);
  };
}

export function resetSearch() {
  return function (dispatch, getState) {
    dispatch(formActions.change('relationships/list/search.searchTerm', ''));
    dispatch(actions.set('relationships/list/filters', Immutable({})));
    return searchReferences()(dispatch, getState);
  };
}

export function switchView(type) {
  return function (dispatch, getState) {
    dispatch(actions.set('relationships/list/view', type));
    if (type === 'graph') {
      return loadAllReferences()(dispatch, getState);
    }
  };
}
