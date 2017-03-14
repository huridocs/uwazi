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
    const entityView = getState().entityView;
    const entityId = entityView.entity.get('sharedId');
    const sort = entityView.sort;
    const filters = entityView.filters;
    const searchTerm = entityView.search && entityView.search.searchTerm ? entityView.search.searchTerm.value : '';
    const options = filters.merge(sort).merge({searchTerm});

    return referencesAPI.search(entityId, options.toJS())
    .then(results => {
      dispatch(actions.set('entityView/searchResults', results));
      dispatch(uiActions.showTab('references'));
    });
  };
}

export function referencesChanged() {
  return function (dispatch, getState) {
    const entityView = getState().entityView;
    const entityId = entityView.entity.get('sharedId');

    return referencesAPI.getGroupedByConnection(entityId)
    .then(referenceGroups => {
      const filteredTemplates = referenceGroups.reduce((templateIds, group) => {
        return templateIds.concat(group.templates.map(t => t._id.toString()));
      }, []);

      const sortOptions = prioritySortingCriteria({currentCriteria: entityView.sort, filteredTemplates, templates: getState().templates});
      return Promise.all([referenceGroups, sortOptions]);
    })
    .then(([referenceGroups, sort]) => {
      dispatch(actions.set('entityView/referenceGroups', referenceGroups));
      dispatch(formActions.merge('entityView.sort', sort));
      return searchReferences()(dispatch, getState);
    });
  };
}

export function deleteReference(reference) {
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
    const entityView = getState().entityView;
    dispatch(actions.set('entityView/filters', entityView.filters.set('limit', limit)));
    return searchReferences()(dispatch, getState);
  };
}

export function setFilter(groupFilterValues) {
  return function (dispatch, getState) {
    const entityView = getState().entityView;
    const currentFilter = entityView.filters.get('filter') || Immutable({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(actions.set('entityView/filters', entityView.filters.set('filter', newFilter)));
    return searchReferences()(dispatch, getState);
  };
}

export function resetSearch() {
  return function (dispatch, getState) {
    dispatch(formActions.change('entityView/search.searchTerm', ''));
    dispatch(actions.set('entityView/filters', Immutable({})));
    return searchReferences()(dispatch, getState);
  };
}
