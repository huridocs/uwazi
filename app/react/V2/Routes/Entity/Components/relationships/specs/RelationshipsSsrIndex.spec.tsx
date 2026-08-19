/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { localeAtom, relationshipTypesAtom, settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { entityWithRelations } from './fixtures/entityWithRelations.js';
import { relationshipQueryFromEntity } from './helpers/relationshipQueryFromEntity.js';
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
        <EntityScopedProvider
          entity={entity}
          language={entity.language}
          relationshipQuery={relationshipQueryFromEntity(entity)}
        >
          <RelationshipsSsrIndex entity={entity} />
        </EntityScopedProvider>
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

describe('RelationshipsSsrIndex', () => {
  it('renders grouped plain links in the HTML without showing them', async () => {
    renderIndex();

    const index = await screen.findByTestId('entity-relationships-ssr-index');
    expect(index).not.toBeVisible();
    expect(screen.getByRole('heading', { name: 'Related', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Related Entity', hidden: true })).toHaveAttribute(
      'href',
      '/en/entity/target-entity'
    );
    expect(screen.getByRole('link', { name: 'Other Entity', hidden: true })).toHaveAttribute(
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
