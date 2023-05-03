import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import * as stories from 'app/stories/Sidepanel.stories';

const { Basic } = composeStories(stories);

describe('Sidepanel', () => {
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
    it('should not allow to click items under the overlay', done => {
      mount(<Basic withOverlay />);
      cy.contains('button', 'Open/Close sidepanel').click();
      cy.contains('h1', 'My sidepanel').should('exist');
      cy.contains('button', 'Open/Close sidepanel').shouldNotBeActionable(done);
      cy.contains('a', 'Proin dapibus luctus purus id viverra.').shouldNotBeActionable(done);
    });
  });
});
