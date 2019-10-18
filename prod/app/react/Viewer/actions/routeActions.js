"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.setViewerState = setViewerState;exports.requestViewerState = requestViewerState;var _BasicReducer = require("../../BasicReducer");
var _documentActions = require("./documentActions");
var _referencesAPI = _interopRequireDefault(require("../referencesAPI"));
var _RelationTypesAPI = _interopRequireDefault(require("../../RelationTypes/RelationTypesAPI"));
var relationships = _interopRequireWildcard(require("../../Relationships/utils/routeUtils"));

var _referencesActions = require("./referencesActions");
var _EntitiesAPI = _interopRequireDefault(require("../../Entities/EntitiesAPI"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

function setViewerState(state) {
  return dispatch => {
    const { documentViewer } = state;
    dispatch(_BasicReducer.actions.set('relationTypes', state.relationTypes));
    dispatch(_BasicReducer.actions.set('viewer/doc', documentViewer.doc));
    dispatch(_BasicReducer.actions.set('viewer/relationTypes', documentViewer.relationTypes));
    dispatch(_BasicReducer.actions.set('viewer/rawText', documentViewer.rawText));
    dispatch((0, _referencesActions.setReferences)(documentViewer.references));
    dispatch(relationships.setReduxState(state));
  };
}

function requestViewerState(requestParams, globalResources) {
  const { sharedId, raw, page } = requestParams.data;
  return Promise.all([
  (0, _documentActions.getDocument)(requestParams.set({ sharedId })),
  _referencesAPI.default.get(requestParams.set({ sharedId })),
  _RelationTypesAPI.default.get(requestParams.onlyHeaders()),
  relationships.requestState(requestParams.set({ sharedId }), globalResources.templates),
  raw ? _EntitiesAPI.default.getRawPage(requestParams.set({ sharedId, pageNumber: page })) : '']).

  then(([doc, references, relationTypes, [connectionsGroups, searchResults, sort], rawText]) => [
  setViewerState({
    documentViewer: {
      doc,
      references,
      relationTypes,
      rawText },

    relationships: {
      list: {
        sharedId: doc.sharedId,
        entity: doc,
        connectionsGroups,
        searchResults,
        sort,
        filters: {},
        view: 'graph' } },


    relationTypes })]);


}