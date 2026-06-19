import React from 'react';
import { mount } from 'cypress/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
  CreateRelationshipModal,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';

const selection: TextSelection = {
  text: 'Selected text for relationship',
  selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
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

const mountRelationshipsFlow = (withSelection: boolean) =>
  mount(
    <RelationshipsStoryShell locale="en">
      <>
        <OpenCreateRelationshipTrigger withSelection={withSelection} />
        <RelationshipsPanel />
        <CreateRelationshipModal />
        <RelationshipsFiltersDrawer />
      </>
    </RelationshipsStoryShell>
  );

describe('Relationships context', () => {
  it('opens the create-relationship modal with selection context', () => {
    mountRelationshipsFlow(true);

    cy.contains('button', 'Open create relationship').click();
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.contains('Select target entity').should('be.visible');
    cy.contains('From:').should('be.visible');
    cy.contains('Selected text for relationship').should('be.visible');
  });

  it('opens entity search when create-relationship has no selection', () => {
    mountRelationshipsFlow(false);

    cy.contains('button', 'Open create relationship').click();
    cy.get('#create-relationship-search').should('be.visible');
    cy.contains('From:').should('not.exist');
  });

  it('closes the modal and keeps the relationship list visible', () => {
    mountRelationshipsFlow(true);

    cy.contains('Person 1').should('be.visible');
    cy.contains('button', 'Open create relationship').click();
    cy.get('[aria-label="Close modal"]').click();
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.contains('Person 1').should('be.visible');
  });

  it('supports selecting text in a target document', () => {
    mountRelationshipsFlow(true);

    cy.intercept('GET', '/api/v2/search*', {
      body: {
        data: [
          {
            _id: 'entity-text-1',
            sharedId: 'shared-text-1',
            title: 'Entity with PDF',
            template: 'template-1',
            metadata: {},
            documents: [
              {
                _id: 'file-text-1',
                filename: 'text-doc.pdf',
                originalname: 'Text document',
                mimetype: 'application/pdf',
              },
            ],
          },
        ],
      },
    }).as('searchEntities');

    cy.contains('button', 'Open create relationship').click();
    cy.get('#create-relationship-search').type('Entity');
    cy.wait('@searchEntities');
    cy.contains('Entity with PDF').click();
    cy.contains('Text document').click();
    cy.contains('related to').click();
    cy.contains('button', 'Continue').click();

    const targetSelection = {
      text: 'Target selected text',
      selectionRectangles: [{ top: 10, left: 10, width: 50, height: 20, regionId: '1' }],
    };

    cy.window()
      .its('__createRelationshipModalTestApi')
      .invoke('handleTargetPdfSelect', targetSelection);

    cy.contains('button', 'Save').should('not.be.disabled');
  });
});
