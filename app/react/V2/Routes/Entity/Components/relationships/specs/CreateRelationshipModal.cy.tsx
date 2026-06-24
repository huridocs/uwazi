import React from 'react';
import { mount } from 'cypress/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { Entity } from '#V2/api/entities/types.js';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  CreateRelationshipModal,
  RelationshipsPanel,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';

const selection: TextSelection = {
  text: 'Selected text for relationship',
  selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
};

const simpleSearchEntity: Entity = {
  _id: 'entity-1',
  sharedId: 'shared-entity-1',
  title: 'Simple entity',
  language: 'en',
  template: 'template2',
  creationDate: 1779195397083,
  user: 'user1',
  metadata: {},
  documents: [],
};

const pdfSearchEntity: Entity = {
  _id: 'entity-text-1',
  sharedId: 'shared-text-1',
  title: 'Entity with PDF',
  language: 'en',
  template: 'template2',
  creationDate: 1779195397083,
  user: 'user1',
  metadata: {},
  documents: [
    {
      _id: 'file-text-1',
      filename: 'text-doc.pdf',
      originalname: 'Text document',
      mimetype: 'application/pdf',
      type: 'document',
      language: 'eng',
    },
  ],
};

const OpenCreateRelationshipTrigger = ({ withSelection }: { withSelection: boolean }) => {
  const { openCreateRelationship } = useRelationshipsActions();
  return (
    <button
      type="button"
      onClick={() => openCreateRelationship(withSelection ? selection : undefined)}
    >
      Open create relationship
    </button>
  );
};

const mountCreateRelationshipModal = ({
  withSelection = true,
  withPanel = false,
}: {
  withSelection?: boolean;
  withPanel?: boolean;
} = {}) =>
  mount(
    <RelationshipsStoryShell locale="en">
      <>
        <OpenCreateRelationshipTrigger withSelection={withSelection} />
        {withPanel && <RelationshipsPanel />}
        <CreateRelationshipModal />
      </>
    </RelationshipsStoryShell>
  );

const openModal = () => {
  cy.contains('button', 'Open create relationship').click();
  cy.get('[data-testid="modal"]').should('be.visible');
};

const searchEntity = (query: string) => {
  cy.intercept('GET', '/api/v2/search*', {
    body: { data: [simpleSearchEntity, pdfSearchEntity] },
  }).as('searchEntities');
  cy.get('#create-relationship-search').type(query);
  cy.wait('@searchEntities');
};

describe('Create relationship dialog', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/relationships/bulk*', { statusCode: 200, body: {} }).as(
      'saveRelationship'
    );
  });

  it('shows the quoted source text when opened from a document selection', () => {
    mountCreateRelationshipModal({ withSelection: true });
    openModal();
    cy.contains('Select target entity').should('be.visible');
    cy.contains('From:').should('be.visible');
    cy.contains('Selected text for relationship').should('be.visible');
  });

  it('lets the user pick a target entity when opened without a source selection', () => {
    mountCreateRelationshipModal({ withSelection: false });
    openModal();
    cy.get('#create-relationship-search').should('be.visible');
    cy.contains('From:').should('not.exist');
  });

  it('can be cancelled from the dialog header', () => {
    mountCreateRelationshipModal();
    openModal();
    cy.get('[aria-label="Close modal"]').click();
    cy.get('[data-testid="modal"]').should('not.exist');
  });

  it('returns to the relationships list after the user cancels', () => {
    mountCreateRelationshipModal({ withPanel: true });
    cy.contains('Person 1').should('be.visible');
    openModal();
    cy.get('[aria-label="Close modal"]').click();
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.contains('Person 1').should('be.visible');
  });

  it('prefills a new entity title from the selected document text', () => {
    mountCreateRelationshipModal({ withSelection: true });
    openModal();
    cy.contains('Create new entity from selection').click();
    cy.contains('New entity').should('be.visible');
    cy.get('#new-entity-title').should('have.value', 'Selected text for relationship');
    cy.contains('Create entity').should('be.visible');
  });

  it('connects two entities with a chosen relationship type', () => {
    mountCreateRelationshipModal({ withSelection: false });
    openModal();
    searchEntity('Simple');
    cy.contains('Simple entity').click();
    cy.contains('Choose relation type').should('be.visible');
    cy.get('[data-testid="modal"]').contains('button', 'related to').click();
    cy.get('[data-testid="modal"]').contains('button', 'Create relationship').click();
    cy.wait('@saveRelationship');
    cy.get('[data-testid="modal"]').should('not.exist');
  });

  it('connects quoted text in the source and target documents', () => {
    mountCreateRelationshipModal({ withSelection: true });
    openModal();
    searchEntity('Entity');
    cy.contains('Entity with PDF').click();
    cy.contains('Text document').click();
    cy.get('[data-testid="modal"]').within(() => {
      cy.contains('button', 'related to').click();
      cy.contains('button', 'Continue').click();
    });

    const targetSelection: TextSelection = {
      text: 'Target selected text',
      selectionRectangles: [{ top: 10, left: 10, width: 50, height: 20, regionId: '1' }],
    };

    cy.window()
      .its('__createRelationshipModalTestApi')
      .invoke('handleTargetPdfSelect', targetSelection);

    cy.contains('button', 'Save').should('not.be.disabled').click();
    cy.wait('@saveRelationship');
    cy.get('[data-testid="modal"]').should('not.exist');
  });
});
