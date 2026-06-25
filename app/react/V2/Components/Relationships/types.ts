import {
  RelationshipView,
  TextReferencePointer,
  anchorOf,
  isTextReference,
  targetPointer,
} from '#V2/formatters/relationships/types.js';

type RelationshipMarker = {
  _id: string;
  view: RelationshipView;
  target: { sharedId: string; title: string; templateId: string };
  anchor?: TextReferencePointer;
};

const markerReferenceText = (marker: RelationshipMarker): string => {
  const selfText = marker.anchor?.text?.trim() ?? '';
  if (selfText) return selfText;
  const counterpart =
    marker.view.from.entity === marker.target.sharedId ? marker.view.from : marker.view.to;
  return isTextReference(counterpart) ? counterpart.text.trim() : '';
};

const markerEvidenceKey = (marker: RelationshipMarker): string =>
  [
    marker.target.sharedId,
    marker.anchor?.selections?.[0]?.page ?? '',
    markerReferenceText(marker),
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
export { toMarker, firstPageOf, markerReferenceText, markerEvidenceKey };
