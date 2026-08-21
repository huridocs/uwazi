import React from 'react';
import { mount } from 'cypress/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  CreateRelationshipModal,
  RelationshipsPanel,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import { expandAllRelationships } from '#V2/Components/Relationships/specs/relationshipsCyHelpers.js';

const adminUser: ClientUserSchema = {
  _id: '1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const editorUser: ClientUserSchema = {
  _id: '2',
  role: 'editor',
  username: 'editor',
  email: 'editor@example.com',
};

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
  relationshipTypes,
  user,
}: {
  withSelection?: boolean;
  withPanel?: boolean;
  relationshipTypes?: { _id: string; name: string }[];
  user?: ClientUserSchema;
} = {}) =>
  mount(
    <RelationshipsStoryShell locale="en" relationshipTypes={relationshipTypes} user={user}>
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
    expandAllRelationships();
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

  it('shows admin empty copy and creates a type on the choose-type step', () => {
    cy.intercept('POST', '**/relationtypes*', {
      statusCode: 200,
      body: { _id: 'new-rel-type', name: 'Custom type' },
    }).as('createType');
    mountCreateRelationshipModal({
      withSelection: false,
      relationshipTypes: [],
      user: adminUser,
    });
    openModal();
    searchEntity('Simple');
    cy.contains('Simple entity').click();
    cy.contains('Choose relation type').should('be.visible');
    cy.contains('No relationship types').should('be.visible');
    cy.contains('Create a type to continue.').should('be.visible');
    cy.contains('button', 'Create relationship').should('be.disabled');
    cy.contains('button', 'Create new relationship type').should('not.exist');
    cy.contains('button', 'Cancel').should('not.exist');
    cy.get('[data-testid="modal"]')
      .find('input[placeholder="New relation type label…"]')
      .should('be.visible')
      .type('Custom type');
    cy.get('[data-testid="modal"]').contains('button', 'Add').click();
    cy.wait('@createType');
    cy.get('[data-testid="modal"]')
      .contains('button', 'Custom type')
      .should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="modal"]')
      .find('input[placeholder="New relation type label…"]')
      .should('have.value', '');
    cy.contains('button', 'Create relationship').should('not.be.disabled');
  });

  it('shows editor empty copy without inline create', () => {
    mountCreateRelationshipModal({
      withSelection: false,
      relationshipTypes: [],
      user: editorUser,
    });
    openModal();
    searchEntity('Simple');
    cy.contains('Simple entity').click();
    cy.contains('No relationship types').should('be.visible');
    cy.contains(
      'An admin needs to add relationship types before you can create a relationship.'
    ).should('be.visible');
    cy.contains('button', 'Create new relationship type').should('not.exist');
    cy.contains('button', 'Add').should('not.exist');
    cy.get('[data-testid="modal"]')
      .find('input[placeholder="New relation type label…"]')
      .should('not.exist');
    cy.contains('button', 'Create relationship').should('be.disabled');
  });

  it('shows always-visible add field for admin when types exist', () => {
    mountCreateRelationshipModal({ withSelection: false, user: adminUser });
    openModal();
    searchEntity('Simple');
    cy.contains('Simple entity').click();
    cy.contains('Choose relation type').should('be.visible');
    cy.get('[data-testid="modal"]')
      .find('input[placeholder="New relation type label…"]')
      .should('be.visible');
    cy.get('[data-testid="modal"]').contains('button', 'Add').should('be.visible');
    cy.contains('button', 'Create new relationship type').should('not.exist');
    cy.contains('button', 'Cancel').should('not.exist');
    cy.get('[data-testid="modal"]').contains('button', 'Back').should('be.visible');
    cy.get('[data-testid="modal"]').contains('button', 'Create relationship').should('be.visible');
  });
});
