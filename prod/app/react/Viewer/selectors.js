"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.parseReferences = exports.selectTargetReferences = exports.selectTargetDoc = exports.selectReferences = exports.selectDoc = void 0;var _reselect = require("reselect");
var _immutable = require("immutable");

const documentViewer = s => s.documentViewer;

function isRelationshipAReference(doc, reference) {
  return reference.get('entity') === doc.get('sharedId') && typeof reference.getIn(['range', 'start']) !== 'undefined';
}

const parseReferences = (doc, refs) => refs.
filter(r => isRelationshipAReference(doc, r)).
reduce((hubs, r) => {
  if (hubs.indexOf(r.get('hub')) === -1) {
    hubs.push(r.get('hub'));
  }
  return hubs;
}, []).
reduce((memo, hubId) => {
  let references = memo;
  const baseReference = refs.find(r => isRelationshipAReference(doc, r) && r.get('hub') === hubId);
  const otherRelationshipsOfHub = refs.filter(r => r.get('_id') !== baseReference.get('_id') && r.get('hub') === hubId);
  otherRelationshipsOfHub.forEach(r => {
    references = references.push(baseReference.set('associatedRelationship', r));
  });
  return references;
}, (0, _immutable.fromJS)([]));exports.parseReferences = parseReferences;

const selectDoc = (0, _reselect.createSelector)(s => documentViewer(s).doc, doc => doc);exports.selectDoc = selectDoc;
const selectRefs = (0, _reselect.createSelector)(s => documentViewer(s).references, references => references);

const selectReferences = (0, _reselect.createSelector)(
selectDoc,
selectRefs,
parseReferences);exports.selectReferences = selectReferences;


const selectTargetDoc = (0, _reselect.createSelector)(s => documentViewer(s).targetDoc, doc => doc);exports.selectTargetDoc = selectTargetDoc;
const selectTargetRefs = (0, _reselect.createSelector)(s => documentViewer(s).targetDocReferences, references => references);

const selectTargetReferences = (0, _reselect.createSelector)(
selectTargetDoc,
selectTargetRefs,
parseReferences);exports.selectTargetReferences = selectTargetReferences;