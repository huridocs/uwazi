/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { RelationshipsSelectionProvider } from '../../context/RelationshipsSelectionContext.js';
import { groupNestedEvidence } from '../rows/RelationshipPanelRow.js';
import { RelationshipRowNestedEvidence } from '../rows/RelationshipRowNestedEvidence.js';
import { relationshipReferenceDisplay } from '../rows/useRelationshipRowData.js';

const SELF = 'self';

const marker = (
  id: string,
  {
    selfText = '',
    selfPage = 2,
    counterpartText = '',
    counterpartPage = 2,
    targetId = id,
    relType = 'rel-type',
  }: {
    selfText?: string;
    selfPage?: number;
    counterpartText?: string;
    counterpartPage?: number;
    targetId?: string;
    relType?: string;
  } = {}
): RelationshipMarker => {
  const selfAnchor = {
    type: 'textReference' as const,
    entity: SELF,
    entityTitle: 'Self',
    entityTemplateId: 'template1',
    file: 'file1',
    text: selfText,
    selections: [{ page: selfPage, top: 10, left: 0, width: 10, height: 10 }],
  };
  const targetSharedId = `target-${targetId}`;
  const to = counterpartText
    ? ({
        type: 'textReference' as const,
        entity: targetSharedId,
        entityTitle: `Target ${targetId}`,
        entityTemplateId: 'template3',
        file: 'file2',
        text: counterpartText,
        selections: [{ page: counterpartPage, top: 10, left: 0, width: 10, height: 10 }],
      } as const)
    : ({
        type: 'entity' as const,
        entity: targetSharedId,
        entityTitle: `Target ${targetId}`,
        entityTemplateId: 'template3',
      } as const);

  return {
    _id: id,
    view: {
      _id: id,
      hub: 'hub-1',
      type: relType,
      from: selfAnchor,
      to,
      relationTypeOnSelf: false,
    },
    target: { sharedId: targetSharedId, title: `Target ${targetId}`, templateId: 'template3' },
    anchor: selfAnchor,
  };
};

describe('RelationshipPanelRow', () => {
  it('groups nested evidence by source, target, type, and counterpart text', () => {
    const groups = groupNestedEvidence(
      [
        marker('1', {
          selfText: 'Article 4',
          selfPage: 3,
          counterpartText: 'Articles 4',
          targetId: '1',
        }),
        marker('2', {
          selfText: 'Article 4',
          selfPage: 4,
          counterpartText: 'Articles 4',
          targetId: '1',
        }),
        marker('3', {
          selfText: 'Article 5',
          selfPage: 3,
          counterpartText: 'Articles 5',
          targetId: '1',
        }),
      ],
      SELF
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]?.markers).toHaveLength(2);
    expect(groups[1]?.markers).toHaveLength(1);
  });

  it('keeps different targets in separate nested evidence groups', () => {
    const groups = groupNestedEvidence(
      [
        marker('1', { counterpartText: 'Articles 4', targetId: '1' }),
        marker('2', { counterpartText: 'Articles 4', targetId: '2' }),
      ],
      SELF
    );

    expect(groups).toHaveLength(2);
  });

  it('merges rows with the same empty counterpart text for the same target and type', () => {
    const groups = groupNestedEvidence(
      [marker('1', { selfPage: 2, targetId: '1' }), marker('2', { selfPage: 3, targetId: '1' })],
      SELF
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.markers).toHaveLength(2);
  });

  it('shows counterpart text and page in relationship rows', () => {
    const m = marker('1', {
      selfText: 'Article 4Human beings are inviolable',
      selfPage: 3,
      counterpartText: 'Articles 4',
      counterpartPage: 2,
      targetId: '1',
    });

    expect(relationshipReferenceDisplay(m, SELF)).toEqual({
      referenceText: 'Articles 4',
      referencePage: 2,
    });
  });

  it('shows the target title when nested evidence has no reference text', () => {
    const store = createStore();
    store.set(templatesAtom, [{ _id: 'template3', color: '#0e9f6e', name: 'Court Case' }]);
    const emptyTextMarker = marker('1', { selfPage: 2, targetId: '1' });

    render(
      <Provider store={store}>
        <RelationshipsSelectionProvider>
          <RelationshipRowNestedEvidence
            rowRef={React.createRef<HTMLDivElement>()}
            marker={emptyTextMarker}
            referenceText=""
            referencePage={2}
            editMode={false}
            representedIds={[emptyTextMarker._id]}
          />
        </RelationshipsSelectionProvider>
      </Provider>
    );

    expect(screen.getByText('Target 1')).toBeInTheDocument();
  });
});
