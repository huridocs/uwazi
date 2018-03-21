import {createSelector} from 'reselect';
import {fromJS as Immutable} from 'immutable';

const documentViewer = (s) => s.documentViewer;

function isRelationshipAReference(doc, reference) {
  return reference.get('entity') === doc.get('sharedId') && typeof reference.getIn(['range', 'start']) !== 'undefined';
}

const parseReferences = (doc, refs) => {
  return refs
  .filter(r => isRelationshipAReference(doc, r))
  .reduce((hubs, r) => {
    if (hubs.indexOf(r.get('hub')) === -1) {
      hubs.push(r.get('hub'));
    }
    return hubs;
  }, [])
  .reduce((memo, hubId) => {
    let references = memo;
    const baseReference = refs.find(r => isRelationshipAReference(doc, r) && r.get('hub') === hubId);
    const otherRelationshipsOfHub = refs.filter(r => r.get('_id') !== baseReference.get('_id') && r.get('hub') === hubId);
    otherRelationshipsOfHub.forEach(r => {
      references = references.push(baseReference.set('associatedRelationship', r));
    });
    return references;
  }, Immutable([]));
};

const selectDoc = createSelector(s => documentViewer(s).doc, doc => doc);
const selectRefs = createSelector(s => documentViewer(s).references, references => references);

const selectReferences = createSelector(
  selectDoc,
  selectRefs,
  parseReferences
);

const selectTargetDoc = createSelector(s => documentViewer(s).targetDoc, doc => doc);
const selectTargetRefs = createSelector(s => documentViewer(s).targetDocReferences, references => references);

const selectTargetReferences = createSelector(
  selectTargetDoc,
  selectTargetRefs,
  parseReferences
);

export {
  selectDoc,
  selectReferences,
  selectTargetDoc,
  selectTargetReferences,
  parseReferences
};
