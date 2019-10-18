"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.setDocument = setDocument;exports.resetDocumentViewer = resetDocumentViewer;exports.loadDefaultViewerMenu = loadDefaultViewerMenu;exports.saveDocument = saveDocument;exports.saveToc = saveToc;exports.deleteDocument = deleteDocument;exports.getDocument = getDocument;exports.loadTargetDocument = loadTargetDocument;exports.cancelTargetDocument = cancelTargetDocument;exports.editToc = editToc;exports.removeFromToc = removeFromToc;exports.indentTocElement = indentTocElement;exports.addToToc = addToToc;var _api = _interopRequireDefault(require("../../utils/api"));
var _referencesAPI = _interopRequireDefault(require("../referencesAPI"));
var types = _interopRequireWildcard(require("./actionTypes"));
var connectionsTypes = _interopRequireWildcard(require("../../Connections/actions/actionTypes"));

var _config = require("../../config.js");
var _BasicReducer = require("../../BasicReducer");
var _reactReduxForm = require("react-redux-form");
var _Documents = require("../../Documents");
var _Notifications = require("../../Notifications");
var _libraryActions = require("../../Library/actions/libraryActions");
var _utils = require("../../utils");
var _Relationships = require("../../Relationships");
var _RequestParams = require("../../utils/RequestParams");
var selectionActions = _interopRequireWildcard(require("./selectionActions"));
var uiActions = _interopRequireWildcard(require("./uiActions"));
var _PDF = require("../../PDF");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function setDocument(document, html) {
  return {
    type: types.SET_DOCUMENT,
    document,
    html };

}

function resetDocumentViewer() {
  return {
    type: types.RESET_DOCUMENT_VIEWER };

}

function loadDefaultViewerMenu() {
  return {
    type: types.LOAD_DEFAULT_VIEWER_MENU };

}

function saveDocument(doc) {
  const updateDoc = {};
  Object.keys(doc).forEach(key => {
    if (key !== 'fullText') {
      updateDoc[key] = doc[key];
    }
  });

  return dispatch => _Documents.documentsApi.save(new _RequestParams.RequestParams(updateDoc)).
  then(updatedDoc => {
    dispatch(_Notifications.notificationActions.notify('Document updated', 'success'));
    dispatch({ type: types.VIEWER_UPDATE_DOCUMENT, doc });
    dispatch(_reactReduxForm.actions.reset('documentViewer.sidepanel.metadata'));
    dispatch(_BasicReducer.actions.set('viewer/doc', updatedDoc));
    dispatch(_Relationships.actions.reloadRelationships(updatedDoc.sharedId));
  });
}

function saveToc(toc) {
  return (dispatch, getState) => {
    const { _id, _rev, sharedId, file } = getState().documentViewer.doc.toJS();
    dispatch(_reactReduxForm.actions.reset('documentViewer.sidepanel.metadata'));
    dispatch(_BasicReducer.actions.set('documentViewer/tocBeingEdited', false));
    return dispatch(saveDocument({ _id, _rev, sharedId, toc, file }));
  };
}

function deleteDocument(doc) {
  return dispatch => _Documents.documentsApi.delete(new _RequestParams.RequestParams({ sharedId: doc.sharedId })).
  then(() => {
    dispatch(_Notifications.notificationActions.notify('Document deleted', 'success'));
    dispatch(resetDocumentViewer());
    dispatch((0, _libraryActions.removeDocument)(doc));
    dispatch((0, _libraryActions.unselectAllDocuments)());
  });
}

function getDocument(requestParams) {
  return _api.default.get('entities', requestParams).
  then(response => {
    const doc = response.json.rows[0];
    if (!_utils.isClient) {
      return doc;
    }
    if (doc.pdfInfo || !doc.file) {
      return doc;
    }
    return _PDF.PDFUtils.extractPDFInfo(`${_config.APIURL}documents/download?_id=${doc._id}`).
    then(pdfInfo => {
      const { _id, sharedId } = doc;
      return _api.default.post('documents/pdfInfo', new _RequestParams.RequestParams({ _id, sharedId, pdfInfo })).
      then(res => res.json);
    });
  });
}

function loadTargetDocument(sharedId) {
  return dispatch => Promise.all([
  getDocument(new _RequestParams.RequestParams({ sharedId })),
  _referencesAPI.default.get(new _RequestParams.RequestParams({ sharedId }))]).

  then(([targetDoc, references]) => {
    dispatch(_BasicReducer.actions.set('viewer/targetDoc', targetDoc));
    dispatch(_BasicReducer.actions.set('viewer/targetDocReferences', references));
  });
}

function cancelTargetDocument() {
  return dispatch => {
    dispatch({ type: connectionsTypes.CANCEL_RANGED_CONNECTION });
    dispatch(_BasicReducer.actions.unset('viewer/targetDoc'));
    dispatch(_BasicReducer.actions.unset('viewer/targetDocReferences'));
    dispatch(selectionActions.unsetTargetSelection());
    dispatch(uiActions.openPanel('viewMetadataPanel'));
  };
}

function editToc(toc) {
  return dispatch => {
    dispatch(_BasicReducer.actions.set('documentViewer/tocBeingEdited', true));
    dispatch(_reactReduxForm.actions.load('documentViewer.tocForm', toc));
    dispatch(uiActions.openPanel('viewMetadataPanel'));
    dispatch(_BasicReducer.actions.set('viewer.sidepanel.tab', 'toc'));
  };
}

function removeFromToc(tocElement) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = state.documentViewer.tocForm;

    toc = toc.filter(entry => entry !== tocElement);

    dispatch(_reactReduxForm.actions.load('documentViewer.tocForm', toc));
  };
}

function indentTocElement(tocElement, indentation) {
  return (dispatch, getState) => {
    const state = getState();
    const toc = state.documentViewer.tocForm.map(_entry => {
      const entry = Object.assign({}, _entry);
      if (_entry === tocElement) {
        entry.indentation = indentation;
      }
      return entry;
    });

    dispatch(_reactReduxForm.actions.load('documentViewer.tocForm', toc));
  };
}

function addToToc(textSelectedObject) {
  return (dispatch, getState) => {
    const state = getState();
    let toc = state.documentViewer.tocForm.concat();
    if (!toc.length) {
      toc = state.documentViewer.doc.toJS().toc || [];
    }
    const tocElement = {
      range: {
        start: textSelectedObject.sourceRange.start,
        end: textSelectedObject.sourceRange.end },

      label: textSelectedObject.sourceRange.text,
      indentation: 0 };


    toc.push(tocElement);
    toc = toc.sort((a, b) => a.range.start - b.range.start);
    dispatch(editToc(toc));
  };
}