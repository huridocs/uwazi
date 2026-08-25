/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { EntityOverlayReferences } from '../EntityOverlayReferences.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

class ResizeObserverMock {
  observe() {}

  disconnect() {}

  unobserve() {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const documentSharedId = 'doc-entity';

const textMarker: RelationshipMarker = {
  _id: 'rel-text',
  target: { sharedId: 'person-1', title: 'Roberto', templateId: 'person-tmpl' },
  relationship: {
    _id: 'rel-text',
    hub: 'hub-1',
    type: 'rel-type-1',
    relationshipTypeName: 'Relates To',
    relationTypeOnSelf: false,
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
      selections: [{ page: 9, top: 0, left: 0, width: 1, height: 1 }],
    },
  },
};

const entityMarker = (id: string, relationshipTypeName: string): RelationshipMarker => ({
  _id: id,
  target: { sharedId: 'person-1', title: 'Roberto', templateId: 'person-tmpl' },
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
      entity: 'person-1',
      entityTitle: 'Roberto',
      entityTemplateId: 'person-tmpl',
    },
  },
});

const renderReferences = (markers: RelationshipMarker[]) =>
  render(
    <TestAtomStoreProvider initialValues={[[relationshipTypesAtom, []]]}>
      <EntityOverlayReferences markers={markers} selfSharedId={documentSharedId} />
    </TestAtomStoreProvider>
  );

describe('EntityOverlayReferences', () => {
  it('shows target reference text with FadeTruncate and relationship type', () => {
    renderReferences([textMarker]);

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Case 11.137')).toBeInTheDocument();
    expect(screen.getByText(/Target-side reference text/)).toBeInTheDocument();
    expect(screen.queryByText(/Document-side text/)).not.toBeInTheDocument();
    expect(screen.queryByText('here')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show more/i })).not.toBeInTheDocument();
    expect(screen.getByText('Relates To')).toBeInTheDocument();
  });

  it('shows one From header for multiple entity-level refs from the same source', () => {
    renderReferences([
      entityMarker('rel-1', 'Another'),
      entityMarker('rel-2', 'Refers To'),
      entityMarker('rel-3', 'Related To'),
    ]);

    expect(screen.getAllByText('From')).toHaveLength(1);
    expect(screen.getByText('Inter-American Count')).toBeInTheDocument();
    expect(screen.getByText('Another')).toBeInTheDocument();
    expect(screen.getByText('Refers To')).toBeInTheDocument();
    expect(screen.getByText('Related To')).toBeInTheDocument();
  });

  it('reveals hidden references with section Show more', () => {
    renderReferences([
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
});
