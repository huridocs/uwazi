import React, { useEffect } from 'react';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import { relationshipTypesAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useDocumentPdfActions,
} from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsActionBar } from '../../panel/RelationshipsActionBar.js';
import { RelationshipsPanel } from '../../panel/RelationshipsPanel.js';
import { CreateRelationshipModal } from '../../create-reference/CreateRelationshipModal.js';
import { entityWithRelations } from '../fixtures/entityWithRelations.js';

const PdfControllerSetup = () => {
  const { setPdfController } = useDocumentPdfActions();
  useEffect(() => {
    setPdfController({ goToPage: jest.fn(), toggleHighlights: jest.fn() } as never);
  }, [setPdfController]);
  return null;
};

const renderRelationshipsActionBar = () => {
  const store = createStore();
  store.set(userAtom, { _id: '1', role: 'admin', username: 'admin', email: 'admin@example.com' });
  store.set(relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]);
  store.set(templatesAtom, [{ _id: 'template1', color: '#faca15', name: 'Entity' }]);

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <Provider store={store}>
          <EntityScopedProvider key={entityWithRelations.sharedId} entity={entityWithRelations}>
            <PdfControllerSetup />
            <RelationshipsPanel />
            <RelationshipsActionBar />
            <CreateRelationshipModal />
          </EntityScopedProvider>
        </Provider>
      ),
    },
  ]);

  return render(<RouterProvider router={router} />);
};

export { renderRelationshipsActionBar };
