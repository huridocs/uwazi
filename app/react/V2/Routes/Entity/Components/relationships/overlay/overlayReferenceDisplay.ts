import { counterpartAnchorOf, selfPointer } from '#V2/formatters/relationships/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type OverlayReferenceDisplay = {
  referenceText: string;
  referencePage: number | undefined;
  sourceSharedId: string;
  sourceEntity: { templateId: string; title: string };
};

const overlayReferenceDisplay = (
  marker: RelationshipMarker,
  documentSharedId: string
): OverlayReferenceDisplay => {
  const targetAnchor = counterpartAnchorOf(marker.relationship, documentSharedId);
  const source = selfPointer(marker.relationship, documentSharedId);
  const referenceText = targetAnchor?.text?.trim() ?? '';

  return {
    referenceText,
    referencePage: targetAnchor?.selections?.[0]?.page,
    sourceSharedId: source.entity,
    sourceEntity: { templateId: source.entityTemplateId, title: source.entityTitle },
  };
};

export type { OverlayReferenceDisplay };
export { overlayReferenceDisplay };
