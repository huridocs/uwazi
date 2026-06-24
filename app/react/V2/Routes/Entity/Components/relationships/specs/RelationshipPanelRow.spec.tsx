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

const marker = (id: string, text: string, page: number, targetId = id): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub: 'hub-1',
    type: 'rel-type',
    from: {
      type: 'textReference',
      entity: 'self',
      entityTitle: 'Self',
      entityTemplateId: 'template1',
      file: 'file1',
      text,
      selections: [{ page, top: 10, left: 0, width: 10, height: 10 }],
    },
    to: {
      type: 'entity',
      entity: `target-${targetId}`,
      entityTitle: `Target ${targetId}`,
      entityTemplateId: 'template3',
    },
    relationTypeOnSelf: false,
  },
  target: { sharedId: `target-${targetId}`, title: `Target ${targetId}`, templateId: 'template3' },
  anchor: {
    type: 'textReference',
    entity: 'self',
    entityTitle: 'Self',
    entityTemplateId: 'template1',
    file: 'file1',
    text,
    selections: [{ page, top: 10, left: 0, width: 10, height: 10 }],
  },
});

describe('RelationshipPanelRow', () => {
  it('groups nested evidence by visible reference text and page', () => {
    const groups = groupNestedEvidence(
      [
        marker('1', 'Same text', 2, '1'),
        marker('2', 'Same text', 2, '1'),
        marker('3', 'Same text', 3, '1'),
      ],
      'self'
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]?.markers).toHaveLength(2);
    expect(groups[1]?.markers).toHaveLength(1);
  });

  it('keeps different targets in separate nested evidence groups', () => {
    const groups = groupNestedEvidence(
      [marker('1', 'Same text', 2), marker('2', 'Same text', 2)],
      'self'
    );

    expect(groups).toHaveLength(2);
  });

  it('keeps different pages separate when reference text is empty', () => {
    const groups = groupNestedEvidence([marker('1', '', 2, '1'), marker('2', '', 3, '1')], 'self');

    expect(groups).toHaveLength(2);
  });

  it('shows the target title when nested evidence has no reference text', () => {
    const store = createStore();
    store.set(templatesAtom, [{ _id: 'template3', color: '#0e9f6e', name: 'Court Case' }]);
    const emptyTextMarker = marker('1', '', 2, '1');

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
