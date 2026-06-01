import React from 'react';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/EntityViewer/References.stories.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { setupMediaIntercepts } from '../../UI/Files/specs/testHelpers.js';

describe('References Display', () => {
  const { Basic } = composeStories(stories);

  const pointButtonFilter = (_: number, element: HTMLElement) => {
    const text = (element.textContent || '').trim();
    return (
      Boolean(element.querySelector('.sr-only')) &&
      Boolean(element.querySelector('span.rounded-full')) &&
      text !== 'Toggle timeline mode' &&
      !/^\d+$/.test(text)
    );
  };

  const clusterButtonFilter = (_: number, element: HTMLElement) =>
    /^\d+$/.test((element.textContent || '').trim());

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

  it('shows clusters in full mode', () => {
    cy.get('button').filter(clusterButtonFilter).should('have.length.greaterThan', 0);
  });

  it('toggles to page mode and displays the current page label', () => {
    cy.contains('button', 'Toggle timeline mode').click();
    cy.contains('span', 'p. 1').should('be.visible');
  });

  it('clicks on a single point and displays its highlight', () => {
    cy.get('button').filter(pointButtonFilter).first().click({ force: true });

    cy.get('[data-highlight-key]').should('have.length.greaterThan', 0);
    cy.contains(/Current page:\s*\d+/).should('be.visible');
  });

  it('clicks on a cluster and changes current page', () => {
    let initialPageLabel = '';

    cy.contains('p', /Current page:/)
      .invoke('text')
      .then(text => {
        initialPageLabel = text.trim();
      });

    cy.get('button').filter(clusterButtonFilter).last().click({ force: true });

    cy.contains('p', /Current page:/).should($page => {
      expect($page.text().trim()).not.to.equal(initialPageLabel);
    });
  });

  it('clicks on a point in an opened cluster and scrolls to highlighted reference', () => {
    cy.get('button').filter(clusterButtonFilter).first().click({ force: true });

    cy.get('button')
      .filter((_, element) => {
        const text = (element.textContent || '').trim();
        return /^\d+$/.test(text) && element.className.includes('bg-(--bg-muted)');
      })
      .first()
      .parent()
      .within(() => {
        cy.get('button').filter(pointButtonFilter).first().click({ force: true });
      });

    cy.get('[data-highlight-key]').should('have.length.greaterThan', 0);
    cy.get('.highlight-rectangle').should('exist');
  });
});
