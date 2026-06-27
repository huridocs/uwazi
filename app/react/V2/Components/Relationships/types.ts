import {
  RelationshipView,
  TextReferencePointer,
  anchorOf,
  counterpartAnchorOf,
  targetPointer,
} from '#V2/formatters/relationships/types.js';

type RelationshipMarker = {
  _id: string;
  view: RelationshipView;
  target: { sharedId: string; title: string; templateId: string };
  anchor?: TextReferencePointer;
};

const markerReferenceText = (marker: RelationshipMarker, selfSharedId: string): string => {
  const counterpartText = counterpartAnchorOf(marker.view, selfSharedId)?.text?.trim() ?? '';
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
    marker.view.type,
    counterpartAnchorOf(marker.view, selfSharedId)?.text?.trim() ?? '',
  ].join('\u0000');

const toMarker = (view: RelationshipView, selfSharedId: string): RelationshipMarker => {
  const target = targetPointer(view, selfSharedId);
  return {
    _id: view._id,
    view,
    target: {
      sharedId: target.entity,
      title: target.entityTitle,
      templateId: target.entityTemplateId,
    },
    anchor: anchorOf(view, selfSharedId),
  };
};

const firstPageOf = (marker: RelationshipMarker): number | undefined =>
  marker.anchor?.selections[0]?.page;

export type { RelationshipMarker };
export {
  toMarker,
  firstPageOf,
  markerReferenceText,
  markerEvidenceKey,
  markerNestedEvidenceKey,
  compareMarkerAppearance,
};
