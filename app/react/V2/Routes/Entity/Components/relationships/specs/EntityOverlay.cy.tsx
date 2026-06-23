import React from 'react';
import { mount } from 'cypress/react';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/relationships/index.js';

const person1Entity = {
  _id: '6a0c5e0584b3eaec97612df6',
  sharedId: 'a2pe98qmqb',
  language: 'en',
  template: 'template2',
  title: 'Person 1',
  creationDate: 1779195397083,
  editDate: 1779195397083,
  user: 'user1',
  icon: { _id: '', type: 'Empty', label: '' },
  metadata: { dob: [{ value: 1777593600 }], gender: [{ value: 'f7c5ffa9', label: 'Male' }] },
  published: true,
  documents: [],
  attachments: [],
};

describe('Entity overlay', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/entities*', {
      body: { rows: [person1Entity] },
    }).as('getOverlayEntity');

    cy.window().then(win => {
      cy.stub(win, 'open').as('windowOpen');
    });

    mount(
      <RelationshipsStoryShell locale="en">
        <RelationshipsPanel />
      </RelationshipsStoryShell>
    );
  });

  it('opens an in-panel preview instead of a new tab', () => {
    cy.contains('Person 1').click();
    cy.get('[aria-label="Preview entity"]').first().click({ force: true });
    cy.wait('@getOverlayEntity');
    cy.get('[data-testid="entity-overlay"]').should('be.visible');
    cy.get('[data-testid="entity-overlay"]').within(() => {
      cy.contains('Person 1').should('be.visible');
      cy.contains('References in document').should('be.visible');
      cy.contains('Open entity').should('be.visible');
    });
    cy.get('@windowOpen').should('not.have.been.called');
  });

  it('closes via the Close button', () => {
    cy.contains('Person 1').click();
    cy.get('[aria-label="Preview entity"]').first().click({ force: true });
    cy.get('[data-testid="entity-overlay"]').should('have.attr', 'aria-hidden', 'false');
    cy.get('[data-testid="entity-overlay"]').find('button[aria-label="Close"]').click();
    cy.get('[data-testid="entity-overlay"]').should('have.attr', 'aria-hidden', 'true');
  });
});
