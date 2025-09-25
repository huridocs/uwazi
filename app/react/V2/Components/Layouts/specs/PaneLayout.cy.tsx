import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Layouts/PaneLayout.stories';

const { Basic } = composeStories(stories);

describe('PaneLayout', () => {
  const render = () => {
    mount(<Basic />);
  };

  describe('Desktop', () => {
    it('should have the expected HTML', () => {
      render();
      cy.get('section').eq(0).should('have.attr', 'style').and('match', /width/);
      cy.get('div.main-view').toMatchSnapshot({ name: 'Pane desktop view' });
    });

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

    it('should save panel setup to the localStorage', () => {});
  });

  describe('mobile', () => {
    it('should render the first pane', () => {});

    it('should swipe between panes', () => {});
  });

  describe('accessibility', () => {
    it('should pass the accessibility check', () => {});

    it('should be able to tab between panes', () => {});

    describe('mobile', { viewportWidth: 450, viewportHeight: 650 }, () => {
      it('should have the expected html ', () => {});

      it('should pass the accessibility check', () => {
        render();
        cy.injectAxe();
        cy.checkA11y();
      });

      it('it should have hidden inputs to switch between panes', () => {});
    });
  });
});
