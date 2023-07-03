import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Sidepanel.stories';

const { Basic } = composeStories(stories);

describe('Sidepanel', () => {
  it('should be accessible', () => {
    mount(<Basic />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should open and close the sidepanel using the button on the page', () => {
    mount(<Basic />);
    cy.contains('button', 'Open/Close sidepanel').click();
    cy.contains('h1', 'My sidepanel').should('exist');

    cy.contains('button', 'Open/Close sidepanel').click();
    cy.contains('h1', 'My sidepanel').should('not.exist');
  });

  it('shuld close the sidepanel using the button on top of the sidepanel', () => {
    mount(<Basic />);
    cy.contains('button', 'Open/Close sidepanel').click();
    cy.get('[data-testid="Close sidepanel"]').click();
    cy.contains('h1', 'My sidepanel').should('not.exist');
  });

  describe('with overlay', () => {
    beforeEach(() => {
      mount(<Basic withOverlay />);
      cy.contains('button', 'Open/Close sidepanel').click();
      cy.contains('h1', 'My sidepanel').should('exist');
    });

    it('should not allow to click items under the overlay', done => {
      cy.contains('button', 'Open/Close sidepanel').shouldNotBeActionable(done);
      cy.contains('a', 'Proin dapibus luctus purus id viverra.').shouldNotBeActionable(done);
    });

    it('should close the sidepanel when clicking outside', () => {
      cy.get('.bg-gray-900').click();
      cy.get('.bg-gray-900').should('not.exist');
      cy.contains('h1', 'My sidepanel').should('not.exist');
    });
  });
});
