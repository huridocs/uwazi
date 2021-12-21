import { fromJS as Immutable } from 'immutable';
import * as attachmentsTypes from 'app/Attachments/actions/actionTypes';
import * as uploadTypes from 'app/Uploads/actions/actionTypes';

const getId = (state, setInArray) => state.getIn(setInArray.concat(['_id']));
const getSharedId = (state, setInArray) => state.getIn(setInArray.concat(['sharedId']));

const getAttachments = (state, setInArray) =>
  state.getIn(setInArray.concat(['attachments'])) || Immutable([]);

const getDocuments = (state, setInArray) =>
  state.getIn(setInArray.concat(['documents'])) || Immutable([]);

export const manageAttachmentsReducer =
  (originalReducer, { useDefaults = true, setInArray = [] } = {}) =>
  (orignialState, originalAction) => {
    let state = orignialState;
    const action = originalAction || {};

    if (useDefaults) {
      state = orignialState || {};
    }

    if (
      action.type === uploadTypes.UPLOAD_COMPLETE &&
      getSharedId(state, setInArray) === action.doc
    ) {
      const documents = getDocuments(state, setInArray);
      return state.setIn(setInArray.concat(['documents']), documents.push(Immutable(action.file)));
    }

    if (
      action.type === attachmentsTypes.ATTACHMENT_COMPLETE &&
      getSharedId(state, setInArray) === action.entity
    ) {
      const attachments = getAttachments(state, setInArray);
      return state.setIn(
        setInArray.concat(['attachments']),
        attachments.push(Immutable(action.file))
      );
    }

    if (
      action.type === attachmentsTypes.ATTACHMENT_DELETED &&
      getSharedId(state, setInArray) === action.entity
    ) {
      const attachments = getAttachments(state, setInArray);
      return state.setIn(
        setInArray.concat(['attachments']),
        attachments.filterNot(a => a.get('_id') === action.file._id)
      );
    }

    if (
      action.type === attachmentsTypes.ATTACHMENT_RENAMED &&
      getSharedId(state, setInArray) === action.entity
    ) {
      if (getId(state, setInArray) === action.file._id) {
        return state.setIn(setInArray.concat(['file']), Immutable(action.file));
      }

      const attachments = getAttachments(state, setInArray);
      return state.setIn(
        setInArray.concat(['attachments']),
        attachments.map(a => {
          if (a.get('_id') === action.file._id) {
            return a.set('originalname', action.file.originalname);
          }

          return a;
        })
      );
    }

    return originalReducer(state, action);
  };
