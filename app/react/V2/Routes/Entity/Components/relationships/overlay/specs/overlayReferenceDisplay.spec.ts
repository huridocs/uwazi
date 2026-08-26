/**
 * @jest-environment jsdom
 */
import { overlayReferenceDisplay } from '../overlayReferenceDisplay.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

const documentSharedId = 'doc-entity';

const baseMarker = (
  overrides: Partial<RelationshipMarker['relationship']> = {}
): RelationshipMarker => ({
  _id: 'rel-1',
  target: { sharedId: 'person-1', title: 'Roberto', templateId: 'person-tmpl' },
  relationship: {
    _id: 'rel-1',
    hub: 'hub-1',
    type: 'rel-type-1',
    relationshipTypeName: 'Relates To',
    relationTypeOnSelf: false,
    from: {
      type: 'entity',
      entity: documentSharedId,
      entityTitle: 'Case 11.137',
      entityTemplateId: 'case-tmpl',
    },
    to: {
      type: 'entity',
      entity: 'person-1',
      entityTitle: 'Roberto',
      entityTemplateId: 'person-tmpl',
    },
    ...overrides,
  },
});

describe('overlayReferenceDisplay', () => {
  it('uses target-side reference text and page only', () => {
    const marker = baseMarker({
      from: {
        type: 'textReference',
        entity: documentSharedId,
        entityTitle: 'Case 11.137',
        entityTemplateId: 'case-tmpl',
        file: 'file-1',
        text: 'Document-side text',
        selections: [{ page: 4, top: 0, left: 0, width: 1, height: 1 }],
      },
      to: {
        type: 'textReference',
        entity: 'person-1',
        entityTitle: 'Roberto',
        entityTemplateId: 'person-tmpl',
        file: 'file-2',
        text: 'Target-side reference text',
        selections: [{ page: 7, top: 0, left: 0, width: 1, height: 1 }],
      },
    });

    expect(overlayReferenceDisplay(marker, documentSharedId)).toEqual({
      referenceText: 'Target-side reference text',
      referencePage: 7,
      sourceSharedId: documentSharedId,
      sourceEntity: { templateId: 'case-tmpl', title: 'Case 11.137' },
    });
  });

  it('exposes source entity for From pill when there is no target text', () => {
    expect(overlayReferenceDisplay(baseMarker(), documentSharedId)).toEqual({
      referenceText: '',
      referencePage: undefined,
      sourceSharedId: documentSharedId,
      sourceEntity: { templateId: 'case-tmpl', title: 'Case 11.137' },
    });
  });
});
