import { createSelector } from 'reselect';
import { Set as ImmutableSet, List as ImmutableList } from 'immutable';

const documentViewer = s => s.documentViewer;

function isRelationshipAReference(doc, reference) {
  return (
    reference.get('entity') === doc.get('sharedId') &&
    typeof reference.getIn(['reference', 'text']) !== 'undefined'
  );
}

const parseReferences = (doc, refs) => {
  const textReferences = ImmutableSet(refs.filter(r => isRelationshipAReference(doc, r)));
  //select basereferences
  const hubIdToBaseReference = new Map();
  textReferences.forEach(tr => {
    const hubId = tr.get('hub');
    if (!hubIdToBaseReference.has(hubId)) {
      hubIdToBaseReference.set(hubId, tr);
    }
  });
  // collect baseref copies with associatedRelationships
  const hubIdToRelationships = new Map();
  Array.from(hubIdToBaseReference.keys()).forEach(hubId => {
    hubIdToRelationships.set(hubId, []);
  });
  refs.forEach(r => {
    const hubId = r.get('hub');
    const baseRef = hubIdToBaseReference.get(hubId);
    if (!textReferences.has(r) && baseRef) {
      hubIdToRelationships.get(hubId).push(baseRef.set('associatedRelationship', r));
    }
  });
  // flatten to immutable list
  const result = ImmutableList(Array.from(hubIdToRelationships.values())).flatMap(v => v);
  return result;
};

const selectDoc = createSelector(
  s => documentViewer(s).doc,
  doc => doc
);
const selectRefs = createSelector(
  s => documentViewer(s).references,
  references => references
);

const selectReferences = createSelector(selectDoc, selectRefs, parseReferences);

const selectTargetDoc = createSelector(
  s => documentViewer(s).targetDoc,
  doc => doc
);

const selectTargetRefs = createSelector(
  s => documentViewer(s).targetDocReferences,
  references => references
);

const selectTargetReferences = createSelector(selectTargetDoc, selectTargetRefs, parseReferences);

export { selectDoc, selectReferences, selectTargetDoc, selectTargetReferences, parseReferences };
