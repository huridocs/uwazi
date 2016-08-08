import * as types from 'app/Viewer/actions/actionTypes';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import documentsAPI from 'app/Documents/DocumentsAPI';
import {notify} from 'app/Notifications';
import {actions} from 'app/BasicReducer';
import * as uiActions from './uiActions';

export function setRelationType(relationType) {
  return {
    type: types.SET_RELATION_TYPE,
    relationType
  };
}

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}

export function saveReference(reference) {
  return function (dispatch, getState) {
    return Promise.all(
      [
        refenrecesAPI.save(reference)
        .then((referenceCreated) => {
          dispatch({
            type: types.ADD_CREATED_REFERENCE,
            reference: referenceCreated
          });

          dispatch(actions.unset('viewer/targetDoc'));
          dispatch(actions.unset('viewer/targetDocHTML'));
          dispatch(actions.unset('viewer/targetDocReferences'));

          dispatch(uiActions.activateReference(referenceCreated._id));
          dispatch(notify('saved successfully !', 'success'));
        }),
        documentsAPI.list([reference.targetDocument])
        .then((result) => {
          let referencedDocuments = getState().documentViewer.referencedDocuments.toJS();
          referencedDocuments.push(result[0]);
          dispatch(actions.set('viewer/referencedDocuments', referencedDocuments));
        })
      ]
    );
  };
}

export function deleteReference(reference) {
  return function (dispatch) {
    return refenrecesAPI.delete(reference)
    .then(() => {
      dispatch(notify('Connection deleted', 'success'));
    });
  };
}
