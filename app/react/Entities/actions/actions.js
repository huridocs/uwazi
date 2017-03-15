import api from '../EntitiesAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import referencesAPI from 'app/Viewer/referencesAPI';
import {removeDocument, removeDocuments, unselectDocument, unselectAllDocuments} from 'app/Library/actions/libraryActions';
import {fromJS as Immutable} from 'immutable';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

import * as uiActions from './uiActions';

export function saveEntity(entity) {
  return function (dispatch) {
    return api.save(entity)
    .then((response) => {
      dispatch(notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return api.delete(entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
      dispatch(removeDocument(entity));
      dispatch(unselectDocument(entity._id));
    });
  };
}

export function deleteEntities(entities) {
  return function (dispatch) {
    return api.deleteMultiple(entities)
    .then(() => {
      dispatch(notify('Deletion success', 'success'));
      dispatch(removeDocuments(entities));
      dispatch(unselectAllDocuments());
    });
  };
}

export function searchReferences() {
  return function (dispatch, getState) {
    const connectionsList = getState().connectionsList;
    const {entityId, sort, filters} = connectionsList;
    const searchTerm = connectionsList.search && connectionsList.search.searchTerm ? connectionsList.search.searchTerm.value : '';
    const options = filters.merge(sort).merge({searchTerm});

    return referencesAPI.search(entityId, options.toJS())
    .then(results => {
      dispatch(actions.set('connectionsList/searchResults', results));
      dispatch(uiActions.showTab('references'));
    });
  };
}

export function referencesChanged() {
  return function (dispatch, getState) {
    const connectionsList = getState().connectionsList;
    const {entityId} = connectionsList;

    return referencesAPI.getGroupedByConnection(entityId)
    .then(connectionsGroups => {
      const filteredTemplates = connectionsGroups.reduce((templateIds, group) => {
        return templateIds.concat(group.templates.map(t => t._id.toString()));
      }, []);

      const sortOptions = prioritySortingCriteria({currentCriteria: connectionsList.sort, filteredTemplates, templates: getState().templates});
      return Promise.all([connectionsGroups, sortOptions]);
    })
    .then(([connectionsGroups, sort]) => {
      dispatch(actions.set('connectionsList/connectionsGroups', connectionsGroups));
      dispatch(formActions.merge('connectionsList.sort', sort));
      return searchReferences()(dispatch, getState);
    });
  };
}

export function deleteConnection(reference) {
  return function (dispatch, getState) {
    return referencesAPI.delete(reference)
    .then(() => {
      dispatch(notify('Connection deleted', 'success'));
      return referencesChanged()(dispatch, getState);
    });
  };
}

export function loadMoreReferences(limit) {
  return function (dispatch, getState) {
    const connectionsList = getState().connectionsList;
    dispatch(actions.set('connectionsList/filters', connectionsList.filters.set('limit', limit)));
    return searchReferences()(dispatch, getState);
  };
}

export function setFilter(groupFilterValues) {
  return function (dispatch, getState) {
    const connectionsList = getState().connectionsList;
    const currentFilter = connectionsList.filters.get('filter') || Immutable({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(actions.set('connectionsList/filters', connectionsList.filters.set('filter', newFilter)));
    return searchReferences()(dispatch, getState);
  };
}

export function resetSearch() {
  return function (dispatch, getState) {
    dispatch(formActions.change('connectionsList/search.searchTerm', ''));
    dispatch(actions.set('connectionsList/filters', Immutable({})));
    return searchReferences()(dispatch, getState);
  };
}
