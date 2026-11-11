import React, { useEffect } from 'react';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import { relationshipTypesAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useDocumentPdfActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { createStubEntityTabsState } from './createStubEntityTabsState.js';
import { EntityTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { RelationshipsActionBarHarness } from './RelationshipsActionBarHarness.js';
import { entityWithRelations } from '../fixtures/entityWithRelations.js';
import {
  relationshipQueryFromEntity,
  relationshipsQueryStubFromEntity,
} from './relationshipQueryFromEntity.js';

const PdfControllerSetup = () => {
  const { setPdfController } = useDocumentPdfActions();
  useEffect(() => {
    setPdfController({ goToPage: jest.fn(), toggleHighlights: jest.fn() } as never);
  }, [setPdfController]);
  return null;
};

type RenderRelationshipsActionBarOptions = {
  role?: ClientUserSchema['role'];
  compact?: boolean;
  footer?: boolean;
};

const renderRelationshipsActionBar = ({
  role = 'admin',
  compact = false,
  footer = false,
}: RenderRelationshipsActionBarOptions = {}) => {
  const store = createStore();
  store.set(userAtom, { _id: '1', role, username: role, email: `${role}@example.com` });
  store.set(relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]);
  store.set(templatesAtom, [{ _id: 'template1', color: '#faca15', name: 'Entity' }]);
  const relationshipQuery = relationshipQueryFromEntity(entityWithRelations);
  const services = createTestServices({
    relationshipsQuery: relationshipsQueryStubFromEntity(entityWithRelations),
    relationshipTypes: {
      countByTypes: async () => [{}],
    },
  });

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <Provider store={store}>
          <ServicesProvider value={services}>
            <EntityScopedProvider
              key={entityWithRelations.sharedId}
              entity={entityWithRelations}
              language={entityWithRelations.language ?? 'en'}
              relationshipQuery={relationshipQuery}
            >
              <EntityTabsProvider value={createStubEntityTabsState()}>
                <PdfControllerSetup />
                <RelationshipsActionBarHarness compact={compact} footer={footer} />
              </EntityTabsProvider>
            </EntityScopedProvider>
          </ServicesProvider>
        </Provider>
      ),
    },
  ]);

  return render(<RouterProvider router={router} />);
};

export { renderRelationshipsActionBar };
