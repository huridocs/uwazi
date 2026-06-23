import React from 'react';
import { mount } from 'cypress/react';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  overlayTargetEntity,
  overlayTemplates,
} from '#app/stories/fixtures/entityOverlayFixtures.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/relationships/index.js';

const openOverlay = () => {
  cy.contains('Person 1').click();
  cy.get('[aria-label="Preview entity"]').first().click({ force: true });
  cy.get('[data-testid="entity-overlay"]').should('be.visible');
  cy.get('[data-testid="entity-overlay"]').contains('Metadata').should('be.visible');
};

describe('Entity overlay', () => {
  beforeEach(() => {
    entityLoaderCache.invalidateEntity(overlayTargetEntity.sharedId);

    cy.intercept('GET', '/api/entities*', {
      body: { rows: [overlayTargetEntity] },
    }).as('getOverlayEntity');

    cy.window().then(win => {
      cy.stub(win, 'open').as('windowOpen');
    });

    mount(
      <RelationshipsStoryShell locale="en" storyTemplates={overlayTemplates}>
        <RelationshipsPanel />
      </RelationshipsStoryShell>
    );
  });

  it('opens an in-panel preview instead of a new tab', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').within(() => {
      cy.contains('Person 1').should('be.visible');
      cy.contains('Metadata').should('be.visible');
      cy.contains('References in document').should('be.visible');
      cy.contains('Open entity').should('be.visible');
    });
    cy.get('@windowOpen').should('not.have.been.called');
  });

  it('shows metadata and properties', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').within(() => {
      cy.contains('Person').should('be.visible');
      cy.contains('Properties').should('be.visible');
      cy.contains('Gender').should('be.visible');
      cy.contains('Male').should('be.visible');
      cy.contains('Date of birth').should('be.visible');
    });
  });

  it('links Open entity to the entity page', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]')
      .contains('Open entity')
      .should('have.attr', 'href', '/en/entityv2/a2pe98qmqb');
  });

  it('closes via the footer Close button', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').contains('button', 'Close').click();
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('closes via the header close button', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').find('button[aria-label="Close"]').click();
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('closes via Escape', () => {
    openOverlay();
    cy.get('body').type('{esc}');
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('uses an opaque panel background', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').should($panel => {
      const { backgroundColor } = window.getComputedStyle($panel[0]);
      expect(backgroundColor).not.to.equal('rgba(0, 0, 0, 0)');
      expect(backgroundColor).not.to.equal('transparent');
    });
  });

  it('closes via backdrop click', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay-backdrop"]').click({ force: true });
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });
});
