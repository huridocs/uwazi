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
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { RelationshipsActionBar } from '../../panel/RelationshipsActionBar.js';
import { RelationshipsPanel } from '../../panel/RelationshipsPanel.js';
import { CreateRelationshipModal } from '../../create-reference/CreateRelationshipModal.js';
import { ManageRelationTypesModal } from '../../create-reference/ManageRelationTypesModal.js';
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
};

const renderRelationshipsActionBar = ({
  role = 'admin',
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
              <PdfControllerSetup />
              <RelationshipsPanel />
              <RelationshipsActionBar />
              <CreateRelationshipModal />
              <ManageRelationTypesModal />
            </EntityScopedProvider>
          </ServicesProvider>
        </Provider>
      ),
    },
  ]);

  return render(<RouterProvider router={router} />);
};

export { renderRelationshipsActionBar };
