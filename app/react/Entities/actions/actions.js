import api from '../EntitiesAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import {removeDocument, removeDocuments, unselectDocument, unselectAllDocuments} from 'app/Library/actions/libraryActions';
import {fromJS as Immutable} from 'immutable';

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

export function addReference(reference) {
  return actions.push('entityView/references', reference);
}

export function deleteReference(reference) {
  return function (dispatch) {
    return refenrecesAPI.delete(reference)
    .then(() => {
      dispatch(actions.remove('entityView/references', reference));
      dispatch(notify('Connection deleted', 'success'));
    });
  };
}

// TEST!!!
export function searchReferences(entityId) {
  // console.log('----------------------------------');
  // console.log('entityId:', entityId);
  // console.log('limit:', limit);

  return function (dispatch, getState) {
    const entiimport {fromJS as Immutable} from 'immutable';tyView = getState().entityView;
    // console.log('entityView:', entityView);
    const sort = entityView.sort;
    // console.log('sort:', sort);
    const filters = entityView.filters;
    // console.log('filters:', filters.toJS());
    const options = filters.merge(sort);
    // console.log('options:', options.toJS());
    // console.log('----------------------------------');
    return refenrecesAPI.search(entityId, options.toJS())
    .then(results => {
      dispatch(actions.set('entityView/searchResults', results));
    });
  };
}

export function loadMoreReferences(limit) {
  return function (dispatch, getState) {
    const entityView = getState().entityView;
    dispatch(actions.set('entityView/filters', entityView.filters.set('limit', limit)));
    return searchReferences(entityView.entity.get('sharedId'))(dispatch, getState);
  };
}

export function setFilter(groupFilterValues) {
  console.log('Group filter values: ', groupFilterValues);
  return function (dispatch, getState) {
    const entityView = getState().entityView;
    const currentFilter = entityView.filters.get('filter') || Immutable({});
    const newFilter = currentFilter.merge(groupFilterValues);
    dispatch(actions.set('entityView/filters', entityView.filters.set('filter', newFilter)));
    return searchReferences(entityView.entity.get('sharedId'))(dispatch, getState);
  };
}
