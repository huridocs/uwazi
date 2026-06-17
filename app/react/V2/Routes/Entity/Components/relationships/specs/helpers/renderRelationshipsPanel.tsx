import React, { useEffect } from 'react';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useDocumentPdfActions,
  useDocumentRelationshipNav,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipSelection } from '#V2/Routes/Entity/Components/document/index.js';
import { RelationshipsPanel } from '../../panel/RelationshipsPanel.js';
import { entityWithRelations } from '../fixtures/entityWithRelations.js';

type PdfMocks = {
  goToPage: jest.Mock;
  toggleHighlights: jest.Mock;
};

type RenderRelationshipsPanelOptions = {
  focusDocumentOnSelect?: boolean;
  onFocusDocument?: jest.Mock;
  pdf?: PdfMocks;
};

const defaultPdf = (): PdfMocks => ({
  goToPage: jest.fn(),
  toggleHighlights: jest.fn(),
});

const PdfControllerSetup = ({ pdf }: { pdf: PdfMocks }) => {
  const { setPdfController } = useDocumentPdfActions();
  useEffect(() => {
    setPdfController(pdf as never);
  }, [pdf, setPdfController]);
  return null;
};

const SelectionState = () => {
  const { activeRelationshipId } = useRelationshipSelection();
  const { scrollToRelationshipPanel } = useDocumentRelationshipNav();
  return (
    <div
      data-testid="selection-state"
      data-active={activeRelationshipId ?? ''}
      data-scroll={scrollToRelationshipPanel ?? ''}
    />
  );
};

const renderRelationshipsPanel = ({
  focusDocumentOnSelect = false,
  onFocusDocument = jest.fn(),
  pdf = defaultPdf(),
}: RenderRelationshipsPanelOptions = {}) => {
  const store = createStore();
  store.set(relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]);
  store.set(templatesAtom, [{ _id: 'template1', color: '#faca15', name: 'Entity' }]);

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <Provider store={store}>
          <EntityScopedProvider entity={entityWithRelations}>
            <PdfControllerSetup pdf={pdf} />
            <RelationshipsPanel
              focusDocumentOnSelect={focusDocumentOnSelect}
              onFocusDocument={onFocusDocument}
            />
            <SelectionState />
          </EntityScopedProvider>
        </Provider>
      ),
    },
  ]);

  return {
    onFocusDocument,
    pdf,
    ...render(<RouterProvider router={router} />),
  };
};

export { renderRelationshipsPanel, defaultPdf };
