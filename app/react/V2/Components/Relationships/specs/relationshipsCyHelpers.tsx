/// <reference types="cypress" />
import React from 'react';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/EntityViewer/Relationships.stories.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { setupMediaIntercepts, setupTestFileIntercept } from '../../UI/Files/specs/testHelpers.js';

const { Basic, WithPanel } = composeStories(stories);

const suppressResizeObserverLoop = () => {
  Cypress.on('uncaught:exception', error => {
    if (error.message.includes('ResizeObserver loop completed with undelivered notifications.')) {
      return false;
    }
    return true;
  });
};

const prepareRelationshipsViewport = () => {
  setupMediaIntercepts();
  setupTestFileIntercept('/sample.pdf', 'cypress/test_files/sample.pdf', 'application/pdf');
  cy.viewport(1280, 800);
};

const resetBasicStoryArgs = () => {
  Basic.args.locale = 'en';
  Basic.args.fileUrl = '/api/files/sample.pdf';
  Basic.args.activeRelationshipId = null;
  Basic.args.onPointClick = undefined;
  Basic.args.onClusterClick = undefined;
};

const waitForDocumentRail = () => {
  cy.get('.page[data-page-number="1"]', { timeout: 20000 }).should('exist');
  cy.get('[data-testid="rail-marker-cluster"]', { timeout: 20000 }).should('exist');
};

const mountBasicStory = () => {
  mount(
    <ThemeProvider>
      <Basic />
    </ThemeProvider>
  );
  waitForDocumentRail();
};

const mountWithPanelStory = () => {
  mount(<WithPanel />);
  waitForDocumentRail();
  cy.get('[aria-label="Search relationships"]', { timeout: 20000 }).should('be.visible');
};

const parseClusterCount = (cluster: Element): number => {
  const text = cluster.querySelector('button')?.textContent?.trim() ?? '0';
  return Number.parseInt(text, 10);
};

const getMainClusterCount = (): Cypress.Chainable<number> =>
  cy.get('[data-testid="rail-marker-cluster"]').then($clusters => {
    const counts = [...$clusters].map(cluster => parseClusterCount(cluster));
    return Math.max(...counts);
  });

const getMarkerZIndex = (element: HTMLElement): number => {
  const inline = Number.parseInt(element.style.zIndex, 10);
  if (!Number.isNaN(inline)) {
    return inline;
  }

  let node: HTMLElement | null = element;

  while (node) {
    const parsed = Number.parseInt(window.getComputedStyle(node).zIndex, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    node = node.parentElement;
  }

  return 0;
};

const getMarkerLayerOrder = (element: HTMLElement): number => {
  const stackOrder = element.getAttribute('data-stack-order');
  if (stackOrder !== null) {
    const parsed = Number.parseInt(stackOrder, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return getMarkerZIndex(element);
};

const openMainCluster = () => {
  getMainClusterCount().then(count => {
    cy.get('[data-testid="rail-marker-cluster"]')
      .contains('button', String(count), { timeout: 20000 })
      .click({ force: true });
  });
};

const clickPerson1InMainCluster = () => {
  getMainClusterCount().then(count => {
    cy.contains('[data-testid="rail-marker-cluster"]', String(count)).within(() => {
      cy.contains('button', 'Person 1').click({ force: true });
    });
  });
};

const clickStandalonePerson2 = () => {
  cy.get('[data-testid="relationships-rail"] [data-testid="rail-marker"]')
    .filter((_index, element) => !element.closest('[data-testid="rail-marker-cluster"]'))
    .filter(':contains("Person 2")')
    .last()
    .click({ force: true });
};

export {
  Basic,
  suppressResizeObserverLoop,
  prepareRelationshipsViewport,
  resetBasicStoryArgs,
  mountBasicStory,
  mountWithPanelStory,
  getMainClusterCount,
  getMarkerZIndex,
  getMarkerLayerOrder,
  openMainCluster,
  clickPerson1InMainCluster,
  clickStandalonePerson2,
};
