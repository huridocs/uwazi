import React from 'react';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/EntityViewer/Relationships.stories.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { setupMediaIntercepts } from '../../UI/Files/specs/testHelpers.js';

const openMainCluster = () => {
  cy.get('[data-testid="rail-marker-cluster"]')
    .contains('button', '25', { timeout: 20000 })
    .should('be.visible')
    .click({ force: true });
};

const togglePageMode = () => {
  cy.contains('button', 'Toggle timeline mode').click();
};

const getOverlappingPairs = (layers: { top: number; zIndex: number }[], distance = 30) =>
  layers.flatMap((lower, lowerIndex) =>
    layers.slice(lowerIndex + 1).flatMap(higher => {
      if (Math.abs(lower.top - higher.top) > distance) {
        return [];
      }

      const earlier = lower.top <= higher.top ? lower : higher;
      const later = lower.top <= higher.top ? higher : lower;
      return [{ earlier, later }];
    })
  );

const assertLaterMarkersOnTop = (layers: { top: number; zIndex: number }[]) => {
  const overlappingPairs = getOverlappingPairs(layers);
  expect(overlappingPairs.length).to.be.greaterThan(0);
  overlappingPairs.forEach(({ earlier, later }) => {
    expect(later.zIndex).to.be.greaterThan(earlier.zIndex);
  });
};

const getMarkerZIndex = (element: HTMLElement): number => {
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
    cy.viewport(1280, 800);
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
    cy.contains('Relationships').should('be.visible');
    cy.contains('Current page: 1').should('be.visible');
    cy.contains('button', 'Toggle timeline mode').should('be.visible');
  });

  it('overlay inside document container', () => {
    cy.get('[data-testid="document-container"]').within(() => {
      cy.get('[data-testid="relationships-rail"]').should('be.visible');
      cy.get('[data-testid="pdf-scroll-container"]').should('exist');
      cy.get('#pdf-container').invoke('attr', 'style').should('include', 'width: 90%');
    });
  });

  it('keeps rail and clusters visible while scrolling', () => {
    cy.get('[data-testid="relationships-rail"]').should('be.visible');
    cy.contains('button', '25').should('be.visible');

    cy.get('[data-testid="relationships-rail"]').then($rail => {
      const railTopBefore = $rail[0].getBoundingClientRect().top;

      cy.get('[data-testid="pdf-scroll-container"]').scrollTo(0, 4000, { duration: 0 });

      cy.get('[data-testid="relationships-rail"]').then($railAfter => {
        expect($railAfter[0].getBoundingClientRect().top).to.be.closeTo(railTopBefore, 2);
      });
      cy.contains('button', '25').should('be.visible');
    });
  });

  it('hides rail on mobile viewport', () => {
    cy.viewport(375, 667);
    cy.get('[data-testid="relationships-rail"]').should('not.exist');
    cy.viewport(1280, 800);
  });

  describe('full document mode', () => {
    it('clicks on a cluster and expands its subtree', () => {
      openMainCluster();
      cy.get('[data-testid="cluster-subtree"]').should('be.visible');
    });

    it('clicks on a point inside a cluster and shows the reference', () => {
      openMainCluster();
      cy.contains('[data-testid="rail-marker-cluster"]', '25').within(() => {
        cy.contains('button', 'Person 1').click({ force: true });
      });
      cy.get('div[data-highlight-key]').should('exist');
    });

    it('renders standalone point markers', () => {
      cy.get('[data-testid="rail-marker"]').should('have.length.at.least', 1);
      cy.get('span').filter(':contains("Person 2")').should('have.length.at.least', 1);
    });

    it('full mode Y uses top ratio', () => {
      cy.get('[data-testid="rail-marker"]').then($markers => {
        const tops = [...$markers].map(el => el.getBoundingClientRect().top);
        const uniqueTops = new Set(tops.map(t => Math.round(t)));
        expect(uniqueTops.size).to.be.greaterThan(1);
      });
    });

    it('cluster size scales with count', () => {
      cy.contains('button', '25').then($large => {
        const largeWidth = $large[0].getBoundingClientRect().width;
        cy.get('[data-testid="rail-marker"]')
          .filter(':not(:contains("25"))')
          .first()
          .then($small => {
            const smallWidth = $small[0].getBoundingClientRect().width;
            expect(largeWidth).to.be.greaterThan(smallWidth);
          });
      });
    });

    it('collapsed cluster does not render a subtree', () => {
      cy.get('[data-testid="cluster-subtree"]').should('not.exist');
    });

    it('cluster expand shows subtree points', () => {
      openMainCluster();
      cy.get('[data-testid="rail-marker-cluster"]')
        .filter(':contains("25")')
        .find('[data-testid="rail-marker"]')
        .should('have.length.at.least', 2);
    });

    it('cluster subtree renders stem trunk and branch svg lines', () => {
      openMainCluster();
      cy.get('[data-testid="cluster-subtree"]').should('be.visible');
      cy.get('[data-testid="cluster-subtree-svg"] line').should('have.length.at.least', 12);
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(0).should('have.attr', 'x1', '28');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(0).should('have.attr', 'x2', '40');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(1).should('have.attr', 'x1', '28');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(1).should('have.attr', 'x2', '28');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(2).should('have.attr', 'x1', '12');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(2).should('have.attr', 'x2', '28');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(2).should('have.attr', 'y1', '5');
      cy.get('[data-testid="cluster-subtree-svg"] line').eq(2).should('have.attr', 'y2', '5');
    });

    it('cluster stacks above standalone points', () => {
      cy.get('[data-testid="rail-marker-cluster"]')
        .first()
        .then($cluster => {
          const clusterZ = getMarkerZIndex($cluster[0]);
          cy.get('[data-testid="relationships-rail"]')
            .find('[data-testid="rail-marker"]')
            .not(':contains("25")')
            .first()
            .then($point => {
              const pointZ = getMarkerZIndex($point[0]);
              expect(clusterZ).to.be.greaterThan(pointZ);
            });
        });
    });

    it('later clusters stack above earlier clusters when overlapping', () => {
      cy.get('[data-testid="rail-marker-cluster"]').then($clusters => {
        const layers = [...$clusters].map(element => ({
          top: element.getBoundingClientRect().top,
          zIndex: getMarkerZIndex(element),
        }));
        assertLaterMarkersOnTop(layers);
      });
    });

    it('later standalone points stack above earlier standalone points when overlapping', () => {
      cy.get('[data-testid="relationships-rail"] [data-testid="rail-marker"]').then($markers => {
        const layers = [...$markers]
          .filter(
            element =>
              !element.closest('[data-testid="cluster-subtree"]') &&
              !element.closest('[data-testid="rail-marker-cluster"]')
          )
          .map(element => ({
            top: element.getBoundingClientRect().top,
            zIndex: getMarkerZIndex(element),
          }));

        if (getOverlappingPairs(layers).length === 0) {
          return;
        }
        assertLaterMarkersOnTop(layers);
      });
    });
  });

  describe('page mode', () => {
    it('toggles to page mode and displays the current page label', () => {
      togglePageMode();
      cy.get('[data-testid="page-mode-label"]').should('contain', 'p. 1');
    });

    it('update as the pages scroll', () => {
      cy.get('[data-testid="pdf-scroll-container"]').scrollTo(0, 4000, { duration: 0 });
      togglePageMode();
      cy.get('[data-testid="page-mode-label"]', { timeout: 20000 })
        .invoke('text')
        .should('match', /p\.\s\d+/);
    });

    it('page edge color dots', () => {
      togglePageMode();
      cy.get('[data-testid="page-count-dots"]').should('exist');
    });

    it('cluster subtree renders in page mode', () => {
      togglePageMode();
      cy.get('[data-testid="page-mode-label"]')
        .invoke('text')
        .should('match', /p\.\s\d+/);
      cy.get('[data-testid="rail-marker"]').should('have.length.at.least', 1);
    });
  });
});
