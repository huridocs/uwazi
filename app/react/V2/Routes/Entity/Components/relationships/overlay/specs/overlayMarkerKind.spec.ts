import { isOverlayRelationshipMarker, isOverlayTextReferenceMarker } from '../overlayMarkerKind.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

const documentSharedId = 'doc-entity';

const entityMarker: RelationshipMarker = {
  _id: 'rel-entity',
  target: { sharedId: 'person-1', title: 'Roberto', templateId: 'person-tmpl' },
  relationship: {
    _id: 'rel-entity',
    hub: 'hub-1',
    type: 'rel-type-1',
    relationshipTypeName: 'Related To',
    relationTypeOnSelf: false,
    from: {
      type: 'entity',
      entity: documentSharedId,
      entityTitle: 'Case',
      entityTemplateId: 'case-tmpl',
    },
    to: {
      type: 'entity',
      entity: 'person-1',
      entityTitle: 'Roberto',
      entityTemplateId: 'person-tmpl',
    },
  },
};

const textMarker: RelationshipMarker = {
  ...entityMarker,
  _id: 'rel-text',
  relationship: {
    ...entityMarker.relationship,
    _id: 'rel-text',
    from: {
      type: 'textReference',
      entity: documentSharedId,
      entityTitle: 'Case',
      entityTemplateId: 'case-tmpl',
      file: 'file-1',
      text: 'Doc text',
      selections: [{ page: 1, top: 0, left: 0, width: 1, height: 1 }],
    },
    to: {
      type: 'entity',
      entity: 'person-1',
      entityTitle: 'Roberto',
      entityTemplateId: 'person-tmpl',
    },
  },
};

describe('overlayMarkerKind', () => {
  it('classifies textReference markers as references', () => {
    expect(isOverlayTextReferenceMarker(textMarker)).toBe(true);
    expect(isOverlayRelationshipMarker(textMarker)).toBe(false);
  });

  it('classifies entity-only markers as relationships', () => {
    expect(isOverlayRelationshipMarker(entityMarker)).toBe(true);
    expect(isOverlayTextReferenceMarker(entityMarker)).toBe(false);
  });
});
