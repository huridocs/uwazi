/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { localeAtom, relationshipTypesAtom, settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { entityWithRelations } from './fixtures/entityWithRelations.js';
import { RelationshipsSsrIndex } from '../panel/RelationshipsSsrIndex.js';

const renderIndex = (entity = entityWithRelations) =>
  render(
    <TestRouterContext>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]],
          [settingsAtom, { features: { featureFlagEntityViewerv2: true } }],
        ]}
      >
        <RelationshipsSsrIndex entity={entity} />
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

describe('RelationshipsSsrIndex', () => {
  it('renders grouped plain links to related entities', async () => {
    renderIndex();

    expect(await screen.findByRole('heading', { name: 'Related' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Related Entity' })).toHaveAttribute(
      'href',
      '/en/entity/target-entity'
    );
    expect(screen.getByRole('link', { name: 'Other Entity' })).toHaveAttribute(
      'href',
      '/en/entity/other-entity'
    );
  });

  it('renders nothing when there are no related entities', async () => {
    renderIndex({ ...entityWithRelations, relations: [] });

    await waitFor(() => {
      expect(screen.queryByTestId('hydrate-fallback')).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId('entity-relationships-ssr-index')).not.toBeInTheDocument();
  });
});
