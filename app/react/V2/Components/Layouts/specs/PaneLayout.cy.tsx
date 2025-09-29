import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Layouts/PaneLayout.stories';

const { Basic } = composeStories(stories);

describe('PaneLayout', () => {
  const render = (localStorageKey?: string) => {
    mount(<Basic localStorageKey={localStorageKey} />);
  };

  describe('Desktop', () => {
    it('should be accessible', () => {
      render();
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should be able to resize panes', () => {
      render();
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('div[role="separator"]'), 50, 0);
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 467px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 347px;');
    });

    it('panel should have a minimum size', () => {
      render();
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('div[role="separator"]'), 298, 0);
      //resizing will fail if it exceeds the minwidth in cypress.
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
    });

    it('should save pane setup to the localStorage', () => {
      render('cypressComponentTest');
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('div[role="separator"]'), 50, 0);
      cy.getAllLocalStorage().then(result => {
        expect(result).to.deep.equal({
          'http://localhost:8080': {
            cypressComponentTest: '[0.3799837266069976,0.2823433685923515,0.33116354759967453]',
          },
        });
      });
      cy.clearAllLocalStorage();
    });

    it('should restore pane configuration from localstorage', () => {
      cy.window().then(window => {
        window.localStorage.setItem('cypressComponentTest', '[0.2,0.2,0.6]');
      });
      render('cypressComponentTest');
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 245.8px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 245.8px;');
      cy.get('section').eq(2).should('have.attr', 'style').and('equal', 'width: 737.4px;');
    });
  });

  describe.only('mobile', { viewportWidth: 450, viewportHeight: 650 }, () => {
    it('should pass the accessibility check', () => {
      render();
      cy.injectAxe();
      cy.checkA11y();
    });

    it('it should have hidden inputs to switch between panes', () => {});

    it('should render the first pane', () => {});

    it('should swipe between panes', () => {});
  });
});
