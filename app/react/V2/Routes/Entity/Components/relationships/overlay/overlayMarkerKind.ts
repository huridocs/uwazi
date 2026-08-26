import { isTextReference } from '#V2/formatters/relationships/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

const isOverlayTextReferenceMarker = (marker: RelationshipMarker): boolean =>
  isTextReference(marker.relationship.from) || isTextReference(marker.relationship.to);

const isOverlayConnectionMarker = (marker: RelationshipMarker): boolean =>
  !isOverlayTextReferenceMarker(marker);

export { isOverlayTextReferenceMarker, isOverlayConnectionMarker };
