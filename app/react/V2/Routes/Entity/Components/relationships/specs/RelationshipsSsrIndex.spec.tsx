/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { localeAtom, relationshipTypesAtom, settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { render } from '@testing-library/react';
import { entityWithRelations } from './fixtures/entityWithRelations.js';
import { RelationshipsSsrIndex } from '../panel/RelationshipsSsrIndex.js';

const renderIndex = () =>
  render(
    <TestRouterContext>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]],
          [settingsAtom, { features: { featureFlagEntityViewerv2: true } }],
        ]}
      >
        <RelationshipsSsrIndex entity={entityWithRelations} />
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

describe('RelationshipsSsrIndex', () => {
  it('renders grouped plain links to related entities', () => {
    renderIndex();

    expect(screen.getByRole('heading', { name: 'Related' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Related Entity' })).toHaveAttribute(
      'href',
      '/en/entity/target-entity'
    );
    expect(screen.getByRole('link', { name: 'Other Entity' })).toHaveAttribute(
      'href',
      '/en/entity/other-entity'
    );
  });

  it('renders nothing when there are no related entities', () => {
    render(
      <TestRouterContext>
        <TestAtomStoreProvider
          initialValues={[
            [relationshipTypesAtom, []],
            [settingsAtom, {}],
          ]}
        >
          <RelationshipsSsrIndex entity={{ ...entityWithRelations, relations: [] }} />
        </TestAtomStoreProvider>
      </TestRouterContext>
    );

    expect(screen.queryByTestId('entity-relationships-ssr-index')).not.toBeInTheDocument();
  });
});
