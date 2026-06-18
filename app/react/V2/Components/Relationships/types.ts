import {
  RelationshipView,
  TextReferencePointer,
  anchorOf,
  targetPointer,
} from '#V2/formatters/relationships/types.js';

type RelationshipMarker = {
  _id: string;
  view: RelationshipView;
  target: { sharedId: string; title: string; templateId: string };
  anchor?: TextReferencePointer;
};

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
export { toMarker, firstPageOf };
