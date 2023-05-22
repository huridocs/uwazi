import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { notificationActions } from 'app/Notifications';
import referencesAPI from 'app/Viewer/referencesAPI';
import { fromJS as Immutable } from 'immutable';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { RequestParams } from 'app/utils/RequestParams';

export function search(requestParams) {
  const { sharedId, sort, filters } = requestParams.data;
  const searchTerm =
    requestParams.data.search && requestParams.data.search.searchTerm
      ? requestParams.data.search.searchTerm.value
      : '';

  let options = { sharedId, ...sort };
  if (filters) {
    options = { sharedId, ...sort, ...filters.toJS(), searchTerm };
  }
  return referencesAPI.search(requestParams.onlyHeaders().add(options));
}

export function searchReferences() {
  return async (dispatch, getState) => {
    const relationshipsList = getState().relationships.list;
    const results = await search(new RequestParams(relationshipsList));
    dispatch(actions.set('relationships/list/searchResults', results));
  };
}

export function connectionsChanged(sharedId) {
  return (dispatch, getState) => {
    dispatch(actions.set('relationships/list/filters', { limit: 10 }));
    const relationshipsList = getState().relationships.list;
    let innerSharedId = sharedId;
    if (!innerSharedId) {
      innerSharedId = relationshipsList.sharedId;
    }
    return referencesAPI
      .getGroupedByConnection(new RequestParams({ sharedId: innerSharedId }))
      .then(connectionsGroups => {
        const filteredTemplates = connectionsGroups.reduce(
          (templateIds, group) => templateIds.concat(group.templates.map(t => t._id.toString())),
          []
        );

        const sortOptions = prioritySortingCriteria.get({
          currentCriteria: relationshipsList.sort,
          filteredTemplates,
          templates: getState().templates,
        });
        return Promise.all([connectionsGroups, sortOptions]);
      })
      .then(([connectionsGroups, sort]) => {
        dispatch(actions.set('relationships/list/connectionsGroups', connectionsGroups));
        dispatch(actions.set('relationships/list/sharedId', sharedId));
        dispatch(formActions.merge('relationships/list.sort', sort));
        return searchReferences()(dispatch, getState);
      });
  };
}

export function deleteConnection(connection) {
  return async (dispatch, getState) => {
    await referencesAPI.delete(new RequestParams({ _id: connection._id }));
    dispatch(notificationActions.notify('Connection deleted', 'success'));
    return connectionsChanged()(dispatch, getState);
  };
}

export function loadAllReferences() {
  return async (dispatch, getState) => {
    const relationshipsList = getState().relationships.list;
    dispatch(
      actions.set('relationships/list/filters', relationshipsList.filters.set('limit', 9999))
    );
    return searchReferences()(dispatch, getState);
  };
}

export function loadMoreReferences(limit) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    dispatch(
      actions.set('relationships/list/filters', relationshipsList.filters.set('limit', limit))
    );
    return searchReferences()(dispatch, getState);
  };
}

export function setFilter(groupFilterValues) {
  return function (dispatch, getState) {
    const relationshipsList = getState().relationships.list;
    const currentFilter = relationshipsList.filters.get('filter') || Immutable({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(
      actions.set('relationships/list/filters', relationshipsList.filters.set('filter', newFilter))
    );
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
