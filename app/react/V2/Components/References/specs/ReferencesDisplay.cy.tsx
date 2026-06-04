import React from 'react';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/EntityViewer/References.stories.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { setupMediaIntercepts } from '../../UI/Files/specs/testHelpers.js';

describe('References Display', () => {
  const { Basic } = composeStories(stories);

  before(() => {
    Cypress.on('uncaught:exception', error => {
      if (error.message.includes('ResizeObserver loop completed with undelivered notifications.')) {
        return false;
      }

      return true;
    });
  });

  beforeEach(() => {
    setupMediaIntercepts();
    Basic.args.locale = 'en';
    Basic.args.fileUrl = '/api/files/sample.pdf';

    mount(
      <ThemeProvider>
        <Basic />
      </ThemeProvider>
    );

    cy.get('.page[data-page-number="1"]', { timeout: 20000 }).should('exist');
  });

  it('renders references story content', () => {
    cy.contains('References').should('be.visible');
    cy.contains('Current page: 1').should('be.visible');
    cy.contains('button', 'Toggle timeline mode').should('be.visible');
  });

  describe('full document mode', () => {
    it('clicks on a cluster and changes current page', () => {
      cy.contains('p', 'Current page: 1');
      cy.contains('button', '25').click();
      cy.contains('p', 'Current page: 8');
    });

    it('clicks on a point inside a cluster and shows the reference', () => {
      cy.contains('button', '25').click();
      cy.contains('div', '25').within(() => {
        cy.contains('button', 'Person 1').click();
      });
      cy.get('div[data-highlight-key="8-8"]').should('exist');
    });

    it('should click on a point and display the reference', () => {
      cy.get('span').filter(':contains("Person 2")').last().parent().click();
      cy.contains('p', 'Current page: 20');
      cy.get('div[data-highlight-key="20-20"]').should('exist');
    });
  });

  describe('page mode', () => {
    it('toggles to page mode and displays the current page label', () => {
      cy.contains('button', 'Toggle timeline mode').click();
      cy.contains('span', 'p. 1').should('be.visible');
    });

    it('update as the pages scroll', () => {
      cy.contains('button', 'Toggle timeline mode').click();
      cy.contains('span', 'p. 1').should('be.visible');
      cy.get('div[id="page-8-container"]').scrollIntoView();
      cy.contains('span', 'p. 8').should('be.visible');
      cy.contains('button', '17');
    });
  });
});
