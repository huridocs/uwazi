/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsPanel } from '../panel/RelationshipsPanel.js';
import { RelationshipsFiltersDrawer } from '../filters/RelationshipsFiltersDrawer.js';
import { entityWithRelations } from './fixtures/entityWithRelations.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const cloneEntityForSharedId = (entity: Entity, sharedId: string, _id: string): Entity => ({
  ...entity,
  _id,
  sharedId,
  relations: entity.relations?.map(relation =>
    relation.entity === entity.sharedId ? { ...relation, entity: sharedId } : relation
  ),
});

const entityWithRelationsB = cloneEntityForSharedId(entityWithRelations, 'shared2', 'ent2');

const createPanelScopeRouter = (entity: Entity) => {
  const store = createStore();
  store.set(relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]);
  store.set(templatesAtom, [{ _id: 'template1', color: '#faca15', name: 'Entity' }]);

  return createMemoryRouter([
    {
      path: '/',
      element: (
        <Provider store={store}>
          <EntityScopedProvider
            key={entity.sharedId}
            entity={entity}
            language={entity.language ?? 'en'}
          >
            <RelationshipsPanel />
            <RelationshipsFiltersDrawer />
          </EntityScopedProvider>
        </Provider>
      ),
    },
  ]);
};

describe('Relationships panel across entities', () => {
  it('clears the search filter when viewing a different entity', async () => {
    const user = userEvent.setup();
    const searchInput = () => screen.getByRole('textbox', { name: /search relationships/i });

    const { unmount } = render(
      <RouterProvider router={createPanelScopeRouter(entityWithRelations)} />
    );

    await user.type(searchInput(), 'alpha');
    expect(searchInput()).toHaveValue('alpha');

    unmount();
    render(<RouterProvider router={createPanelScopeRouter(entityWithRelationsB)} />);

    expect(searchInput()).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
    expect(screen.getByText('Other Entity')).toBeInTheDocument();
  });
});
