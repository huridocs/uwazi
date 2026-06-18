import {
  mountWithPanelStory,
  openMainCluster,
  clickPerson1InMainCluster,
  prepareRelationshipsViewport,
  suppressResizeObserverLoop,
} from './relationshipsCyHelpers.js';

describe('RelationshipsDisplay WithPanel', () => {
  before(() => {
    suppressResizeObserverLoop();
  });

  beforeEach(() => {
    prepareRelationshipsViewport();
    mountWithPanelStory();
  });

  describe('layout', () => {
    it('renders the document rail and panel toolbar together', () => {
      cy.get('[data-testid="document-container"]').should('be.visible');
      cy.get('[data-testid="relationships-rail"]').should('be.visible');
      cy.contains('Relationships').should('be.visible');
      cy.contains('relationships').should('be.visible');
      cy.contains('button', 'Filters').should('be.visible');
    });
  });

  describe('panel toolbar', () => {
    it('updates search and clears it from the panel search bar', () => {
      cy.get('[aria-label="Search relationships"]').type('witness');
      cy.get('[aria-label="Search relationships"]').should('have.value', 'witness');
      cy.get('[aria-label="Search relationships"]')
        .parent()
        .find('[aria-label="Clear search"]')
        .last()
        .click();
      cy.get('[aria-label="Search relationships"]').should('have.value', '');
    });

    it('shows a sort chip when sort changes and removes it from the search bar', () => {
      cy.contains('button', 'Appearance').click();
      cy.get('[role="listbox"][aria-label="Sort order"]').contains('Z → A').click();
      cy.contains('Z → A').should('be.visible');
      cy.get('[aria-label="Clear sort"]').click();
      cy.contains('button', 'None').should('be.visible');
    });

    it('switches list, tree, and graph views', () => {
      cy.get('[aria-label="List"]').should('have.attr', 'aria-checked', 'true');
      cy.get('[aria-label="Tree"]').click();
      cy.get('[aria-label="Tree"]').should('have.attr', 'aria-checked', 'true');
      cy.get('[aria-label="Graph"]').click();
      cy.get('[aria-label="Graph"]').should('have.attr', 'aria-checked', 'true');
      cy.get('[dir="ltr"] svg').should('exist');
    });

    it('groups the list and enables collapse controls', () => {
      cy.contains('button', 'Collapse all').should('be.disabled');
      cy.contains('button', 'None').click();
      cy.get('[role="listbox"][aria-label="Group by:"]').contains('Target template').click();
      cy.contains('button', 'Target template').should('be.visible');
      cy.contains('button', 'Collapse all').should('not.be.disabled');
      cy.get('[aria-label="Detail"]').should('not.be.disabled');
    });
  });

  describe('filters drawer', () => {
    it('opens the drawer, toggles a facet section, and applies a relation type filter', () => {
      cy.contains('button', 'Filters').click();
      cy.get('[role="dialog"][aria-label="Filters"]').should('be.visible');
      cy.contains('Relation type').should('be.visible');
      cy.contains('button', 'Relation type').click();
      cy.get('[aria-label="related to"]').should('not.exist');
      cy.contains('button', 'Relation type').click();
      cy.get('[aria-label="related to"]').check();
      cy.get('[aria-label="Close filters"]').click();
      cy.get('[role="dialog"][aria-label="Filters"]').should('not.be.visible');
      cy.contains('button', 'Filters').should('contain', '2');
      cy.contains('related to').should('be.visible');
    });
  });

  describe('document sync', () => {
    it('marks the selected reference on the rail when clicked from a cluster', () => {
      openMainCluster();
      clickPerson1InMainCluster();
      cy.get('[data-testid="relationships-rail"] [data-marker-id]')
        .filter(':contains("Person 1")')
        .first()
        .find('[data-testid="rail-marker-dot"]')
        .should('have.css', 'width', '14px');
    });

    it('adds a cluster filter chip when a rail cluster is clicked', () => {
      openMainCluster();
      cy.contains('From selection').should('be.visible');
      cy.contains('button', 'Filters').should('contain', '2');
    });
  });
});
