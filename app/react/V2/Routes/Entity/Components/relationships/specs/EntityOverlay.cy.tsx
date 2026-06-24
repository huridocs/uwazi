import React from 'react';
import { DateTime } from 'luxon';
import { mount } from 'cypress/react';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  overlayTargetEntity,
  overlayTargetSharedId,
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

describe('Entity preview overlay', () => {
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

  it('previews a related entity inside the relationships panel', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').within(() => {
      cy.contains('Person 1').should('be.visible');
      cy.contains('Metadata').should('be.visible');
      cy.contains('References in document').should('be.visible');
      cy.contains('Open entity').should('be.visible');
    });
    cy.get('@windowOpen').should('not.have.been.called');
  });

  it('shows the related entity metadata and template properties', () => {
    const formattedDob = DateTime.fromSeconds(1777593600, { zone: 'utc' })
      .setLocale('en')
      .toLocaleString(DateTime.DATE_MED);

    openOverlay();
    cy.get('[data-testid="entity-overlay"]').within(() => {
      cy.contains('Person').should('be.visible');
      cy.contains('Properties').should('be.visible');
      cy.contains('Gender').should('be.visible');
      cy.contains('Male').should('be.visible');
      cy.contains('Date of birth').should('be.visible');
      cy.contains(formattedDob).should('be.visible');
    });
  });

  it('announces the preview as an accessible dialog', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]')
      .should('have.attr', 'role', 'dialog')
      .and('have.attr', 'aria-modal', 'true')
      .and('have.attr', 'aria-labelledby');
  });

  it('merges overlay metadata without dropping cached relationships', () => {
    const cachedEntity = { ...overlayTargetEntity, relations: [] };
    entityLoaderCache.setEntity(overlayTargetSharedId, 'en', cachedEntity);

    openOverlay();

    cy.window().then(() => {
      const cached = entityLoaderCache.getEntity(overlayTargetSharedId, 'en', {
        requireRelationships: true,
      });
      expect(cached).to.have.property('relations');
    });
  });

  it('offers a link to open the full entity page', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]')
      .contains('Open entity')
      .should('have.attr', 'href', '/en/entityv2/a2pe98qmqb');
  });

  it('can be dismissed from the footer', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').contains('button', 'Close').click();
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('can be dismissed from the header', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').find('button[aria-label="Close"]').click();
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('can be dismissed with the Escape key', () => {
    openOverlay();
    cy.get('body').type('{esc}');
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });

  it('obscures the relationships list while open', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay"]').should($panel => {
      const { backgroundColor } = window.getComputedStyle($panel[0]);
      expect(backgroundColor).not.to.equal('rgba(0, 0, 0, 0)');
      expect(backgroundColor).not.to.equal('transparent');
    });
  });

  it('can be dismissed by clicking outside the preview', () => {
    openOverlay();
    cy.get('[data-testid="entity-overlay-backdrop"]').click({ force: true });
    cy.get('[data-testid="entity-overlay"]').should('not.exist');
  });
});
