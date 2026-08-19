import React, { useEffect } from 'react';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useDocumentPdfActions,
  useDocumentRelationshipNav,
} from '#V2/Routes/Entity/Components/context/index.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { RelationshipsPanel } from '../../panel/RelationshipsPanel.js';
import { RelationshipsFiltersDrawer } from '../../filters/RelationshipsFiltersDrawer.js';
import { entityWithRelations } from '../fixtures/entityWithRelations.js';
import {
  relationshipQueryFromEntity,
  relationshipsQueryStubFromEntity,
} from './relationshipQueryFromEntity.js';

type PdfMocks = {
  goToPage: jest.Mock;
  toggleHighlights: jest.Mock;
};

type RenderRelationshipsPanelOptions = {
  entity?: Entity;
  mainDocument?: FileType;
  focusDocumentOnSelect?: boolean;
  onFocusDocument?: jest.Mock;
  pdf?: PdfMocks;
  withFiltersDrawer?: boolean;
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

// eslint-disable-next-line react/no-multi-comp
const SelectionState = () => {
  const { activeRelationshipId, scrollToRelationshipPanel } = useDocumentRelationshipNav();
  return (
    <div
      data-testid="selection-state"
      data-active={activeRelationshipId ?? ''}
      data-scroll={scrollToRelationshipPanel ?? ''}
    />
  );
};

const renderRelationshipsPanel = ({
  entity = entityWithRelations,
  mainDocument,
  focusDocumentOnSelect = false,
  onFocusDocument = jest.fn(),
  pdf = defaultPdf(),
  withFiltersDrawer = false,
}: RenderRelationshipsPanelOptions = {}) => {
  const store = createStore();
  store.set(relationshipTypesAtom, [{ _id: 'relA', name: 'Related' }]);
  store.set(templatesAtom, [{ _id: 'template1', color: '#faca15', name: 'Entity' }]);
  const relationshipQuery = relationshipQueryFromEntity(entity, mainDocument?._id);
  const services = createTestServices({
    relationshipsQuery: relationshipsQueryStubFromEntity(entity, mainDocument?._id),
  });

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <Provider store={store}>
          <ServicesProvider value={services}>
            <EntityScopedProvider
              key={entity.sharedId}
              entity={entity}
              language={entity.language ?? 'en'}
              mainDocument={mainDocument}
              relationshipQuery={relationshipQuery}
            >
              <PdfControllerSetup pdf={pdf} />
              <RelationshipsPanel
                focusDocumentOnSelect={focusDocumentOnSelect}
                onFocusDocument={onFocusDocument}
              />
              {withFiltersDrawer && <RelationshipsFiltersDrawer />}
              <SelectionState />
            </EntityScopedProvider>
          </ServicesProvider>
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
export type { RenderRelationshipsPanelOptions };
