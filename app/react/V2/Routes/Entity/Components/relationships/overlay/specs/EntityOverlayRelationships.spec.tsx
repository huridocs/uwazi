/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { EntityOverlayRelationships } from '../EntityOverlayRelationships.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

const documentSharedId = 'doc-entity';
const targetSharedId = 'person-1';

const entityMarker = (id: string, relationshipTypeName: string): RelationshipMarker => ({
  _id: id,
  target: { sharedId: targetSharedId, title: 'Roberto', templateId: 'person-tmpl' },
  relationship: {
    _id: id,
    hub: `hub-${id}`,
    type: `rel-type-${id}`,
    relationshipTypeName,
    relationTypeOnSelf: false,
    from: {
      type: 'entity',
      entity: documentSharedId,
      entityTitle: 'Inter-American Count',
      entityTemplateId: 'case-tmpl',
    },
    to: {
      type: 'entity',
      entity: targetSharedId,
      entityTitle: 'Roberto',
      entityTemplateId: 'person-tmpl',
    },
  },
});

const renderRelationships = (markers: RelationshipMarker[]) =>
  render(
    <TestAtomStoreProvider initialValues={[[relationshipTypesAtom, []]]}>
      <EntityOverlayRelationships markers={markers} selfSharedId={documentSharedId} />
    </TestAtomStoreProvider>
  );

describe('EntityOverlayRelationships', () => {
  it('lists entity-level relationships without anchor text', () => {
    renderRelationships([
      entityMarker('rel-1', 'Another'),
      entityMarker('rel-2', 'Refers To'),
      entityMarker('rel-3', 'Related To'),
    ]);

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getAllByText('From')).toHaveLength(1);
    expect(screen.getByText('Inter-American Count')).toBeInTheDocument();
    expect(screen.getByText('Another')).toBeInTheDocument();
    expect(screen.getByText('Refers To')).toBeInTheDocument();
    expect(screen.getByText('Related To')).toBeInTheDocument();
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it('reveals hidden relationships with section Show more', () => {
    renderRelationships([
      entityMarker('rel-1', 'One'),
      entityMarker('rel-2', 'Two'),
      entityMarker('rel-3', 'Three'),
      entityMarker('rel-4', 'Four'),
      entityMarker('rel-5', 'Five'),
      entityMarker('rel-6', 'Six'),
      entityMarker('rel-7', 'Seven'),
      entityMarker('rel-8', 'Eight'),
      entityMarker('rel-9', 'Nine'),
      entityMarker('rel-10', 'Ten'),
      entityMarker('rel-11', 'Eleven'),
    ]);

    expect(screen.queryByText('Eleven')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show more/i }));
    expect(screen.getByText('Eleven')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show less/i })).toBeInTheDocument();
  });

  it('renders nothing when there are no relationships', () => {
    const { container } = renderRelationships([]);
    expect(container).toBeEmptyDOMElement();
  });
});
