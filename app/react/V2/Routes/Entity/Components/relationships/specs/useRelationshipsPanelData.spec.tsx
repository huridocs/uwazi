/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import {
  EntityScopedProvider,
  useRelationshipsPanelData,
} from '../../context/EntityScopedProvider.js';

const entityWithRelations = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Source',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [
    {
      template: 'relA',
      _id: 'c1',
      hub: 'h1',
      file: 'f1',
      entity: 'shared1',
      entityData: { title: 'Source', template: 'template1' },
      reference: {
        text: 'alpha snippet',
        selectionRectangles: [{ top: 50, left: 0, width: 10, height: 10, page: '2' }],
      },
    },
    {
      template: null,
      _id: 'c2',
      hub: 'h1',
      entity: 'target-entity',
      entityData: { title: 'Related Entity', template: 'template1' },
    },
  ],
} as Entity;

const PanelDataProbe = () => {
  const { hasRelationships } = useRelationshipsPanelData();
  return <div>{hasRelationships ? 'has markers' : 'no markers'}</div>;
};

describe('useRelationshipsPanelData', () => {
  it('keeps markers after a panel consumer unmounts', () => {
    const { unmount } = render(
      <EntityScopedProvider entity={entityWithRelations}>
        <PanelDataProbe />
      </EntityScopedProvider>
    );

    expect(screen.getByText('has markers')).toBeInTheDocument();
    unmount();

    render(
      <EntityScopedProvider entity={entityWithRelations}>
        <PanelDataProbe />
      </EntityScopedProvider>
    );

    expect(screen.getByText('has markers')).toBeInTheDocument();
  });
});
