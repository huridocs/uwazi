import {
  DirectedRelationship,
  TextReferencePointer,
  anchorOf,
  counterpartAnchorOf,
  targetPointer,
} from '#V2/formatters/relationships/types.js';

type RelationshipMarker = {
  _id: string;
  relationship: DirectedRelationship;
  target: { sharedId: string; title: string; templateId: string };
  anchor?: TextReferencePointer;
};

const markerReferenceText = (marker: RelationshipMarker, selfSharedId: string): string => {
  const counterpartText =
    counterpartAnchorOf(marker.relationship, selfSharedId)?.text?.trim() ?? '';
  if (counterpartText) return counterpartText;
  return marker.anchor?.text?.trim() ?? '';
};

const markerEvidenceKey = (marker: RelationshipMarker): string =>
  [
    marker.target.sharedId,
    marker.anchor?.selections?.[0]?.page ?? '',
    marker.anchor?.selections?.[0]?.top ?? '',
    markerReferenceText(marker, marker.anchor?.entity ?? ''),
  ].join('\u0000');

const compareMarkerAppearance = (a: RelationshipMarker, b: RelationshipMarker): number => {
  const pageA = Number(a.anchor?.selections?.[0]?.page ?? 0);
  const pageB = Number(b.anchor?.selections?.[0]?.page ?? 0);
  if (pageA !== pageB) return pageA - pageB;
  return (a.anchor?.selections?.[0]?.top ?? 0) - (b.anchor?.selections?.[0]?.top ?? 0);
};

const markerNestedEvidenceKey = (marker: RelationshipMarker, selfSharedId: string): string =>
  [
    selfSharedId,
    marker.target.sharedId,
    marker.relationship.type,
    counterpartAnchorOf(marker.relationship, selfSharedId)?.text?.trim() ?? '',
  ].join('\u0000');

const toMarker = (relationship: DirectedRelationship, selfSharedId: string): RelationshipMarker => {
  const target = targetPointer(relationship, selfSharedId);
  return {
    _id: relationship._id,
    relationship,
    target: {
      sharedId: target.entity,
      title: target.entityTitle,
      templateId: target.entityTemplateId,
    },
    anchor: anchorOf(relationship, selfSharedId),
  };
};

const firstPageOf = (marker: RelationshipMarker): number | undefined =>
  marker.anchor?.selections[0]?.page;

const markerTop = (marker: RelationshipMarker): number => {
  const top = marker.anchor?.selections?.[0]?.top;
  return typeof top === 'number' ? top : 0;
};

export type { RelationshipMarker };
export {
  toMarker,
  firstPageOf,
  markerTop,
  markerReferenceText,
  markerEvidenceKey,
  markerNestedEvidenceKey,
  compareMarkerAppearance,
};
