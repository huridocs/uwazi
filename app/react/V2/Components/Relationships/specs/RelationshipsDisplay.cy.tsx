/// <reference types="cypress" />
import React from 'react';
import { mount } from 'cypress/react';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { RelationshipMarker } from '../types.js';
import {
  Basic,
  mountBasicStory,
  openMainCluster,
  clickPerson1InMainCluster,
  clickStandalonePerson2,
  getMainClusterCount,
  getMarkerZIndex,
  getMarkerLayerOrder,
  prepareRelationshipsViewport,
  resetBasicStoryArgs,
  suppressResizeObserverLoop,
} from './relationshipsCyHelpers.js';

const togglePageMode = () => {
  cy.contains('button', 'Toggle timeline mode').click();
};

const scrollToPage8 = () => {
  cy.get('div[id="page-8-container"]').then($el => {
    scrollIntoView($el[0], { block: 'start' });
  });
  cy.contains('Current page: 8', { timeout: 20000 }).should('be.visible');
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

describe('References Display', () => {
  before(() => {
    suppressResizeObserverLoop();
  });

  beforeEach(() => {
    prepareRelationshipsViewport();
    resetBasicStoryArgs();
  });

  describe('layout and rendering', () => {
    beforeEach(() => {
      mountBasicStory();
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
      getMainClusterCount().then(count => {
        cy.get('[data-testid="relationships-rail"]').should('be.visible');
        cy.contains('button', String(count)).should('be.visible');

        cy.get('[data-testid="relationships-rail"]').then($rail => {
          const railTopBefore = $rail[0].getBoundingClientRect().top;

          cy.get('[data-testid="pdf-scroll-container"]').scrollTo(0, 4000, { duration: 0 });

          cy.get('[data-testid="relationships-rail"]').then($railAfter => {
            expect($railAfter[0].getBoundingClientRect().top).to.be.closeTo(railTopBefore, 2);
          });
          cy.contains('button', String(count)).should('be.visible');
        });
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
        clickPerson1InMainCluster();
        cy.get('div[data-highlight-key]', { timeout: 20000 }).should('exist');
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
        getMainClusterCount().then(count => {
          cy.contains('button', String(count)).then($large => {
            const largeWidth = $large[0].getBoundingClientRect().width;
            cy.get('[data-testid="rail-marker"]')
              .filter(`:not(:contains("${count}"))`)
              .first()
              .then($small => {
                const smallWidth = $small[0].getBoundingClientRect().width;
                expect(largeWidth).to.be.greaterThan(smallWidth);
              });
          });
        });
      });

      it('collapsed cluster does not render a subtree', () => {
        cy.get('[data-testid="cluster-subtree"]').should('not.exist');
      });

      it('cluster expand shows subtree points', () => {
        openMainCluster();
        getMainClusterCount().then(count => {
          cy.get('[data-testid="rail-marker-cluster"]')
            .filter(`:contains("${count}")`)
            .find('[data-testid="rail-marker"]')
            .should('have.length.at.least', 2);
        });
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

      it('aligns the cluster stem with the cluster button center', () => {
        openMainCluster();
        getMainClusterCount().then(count => {
          cy.contains('[data-testid="rail-marker-cluster"]', String(count)).within(() => {
            cy.get('button[data-testid="rail-marker"]').then($button => {
              const buttonCenter =
                $button[0].getBoundingClientRect().top + $button[0].offsetHeight / 2;
              cy.get('[data-testid="cluster-subtree-svg"] line')
                .eq(0)
                .then($stem => {
                  const stemRect = $stem[0].getBoundingClientRect();
                  const stemCenter = stemRect.top + stemRect.height / 2;
                  expect(stemCenter).to.be.closeTo(buttonCenter, 2);
                });
            });
          });
        });
      });

      it('cluster stacks above standalone points', () => {
        getMainClusterCount().then(count => {
          cy.get('[data-testid="rail-marker-cluster"]')
            .first()
            .then($cluster => {
              const clusterZ = getMarkerZIndex($cluster[0]);
              cy.get('[data-testid="relationships-rail"]')
                .find('[data-testid="rail-marker"]')
                .not(`:contains("${count}")`)
                .first()
                .then($point => {
                  const pointZ = getMarkerZIndex($point[0]);
                  expect(clusterZ).to.be.greaterThan(pointZ);
                });
            });
        });
      });

      it('later clusters stack above earlier clusters when overlapping', () => {
        cy.get('[data-testid="rail-marker-cluster"]').then($clusters => {
          const layers = Cypress.$.makeArray($clusters).map(element => ({
            top: element.getBoundingClientRect().top,
            zIndex:
              Number.parseInt(element.getAttribute('data-stack-order') ?? '', 10) ||
              getMarkerZIndex(element),
          }));

          if (getOverlappingPairs(layers).length === 0) {
            return;
          }
          assertLaterMarkersOnTop(layers);
        });
      });

      it('later standalone points stack above earlier standalone points when overlapping', () => {
        cy.get('[data-testid="relationships-rail"] [data-testid="rail-marker"]').then($markers => {
          const layers = Cypress.$.makeArray($markers)
            .filter(
              element =>
                !element.closest('[data-testid="cluster-subtree"]') &&
                !element.closest('[data-testid="rail-marker-cluster"]')
            )
            .map(element => ({
              top: element.getBoundingClientRect().top,
              zIndex: getMarkerLayerOrder(element),
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
        cy.contains('span', 'p. 1').should('be.visible');
      });

      it('update as the pages scroll', () => {
        togglePageMode();
        cy.contains('span', 'p. 1').should('be.visible');
        scrollToPage8();
        cy.contains('Current page: 8', { timeout: 20000 }).should('be.visible');
        cy.contains('span', 'p. 8').should('be.visible');
        cy.get('[data-testid="relationships-rail"]').should('contain', '14');
        cy.get('[data-testid="rail-marker-cluster"]').should('have.length.at.least', 1);
      });

      it('page edge color dots', () => {
        togglePageMode();
        scrollToPage8();
        cy.contains('span', 'p. 8').should('be.visible');
        cy.get('[data-testid="page-count-dots"]').should('exist');
      });

      it('cluster subtree renders in page mode', () => {
        togglePageMode();
        scrollToPage8();
        cy.contains('span', 'p. 8').should('be.visible');
        openMainCluster();
        cy.get('[data-testid="cluster-subtree"]').should('exist');
      });
    });
  });

  describe('handler interactions', () => {
    it('calls onClusterClick with cluster markers', () => {
      Basic.args.onClusterClick = cy.stub().as('onClusterClick');
      mountBasicStory();

      getMainClusterCount().then(count => {
        cy.contains('button', String(count)).click({ force: true });

        cy.get('@onClusterClick').should('have.been.calledOnce');
        cy.get('@onClusterClick').its('firstCall.args.0').should('have.length', count);
        cy.get('@onClusterClick')
          .its('firstCall.args.0')
          .then((markers: RelationshipMarker[]) => {
            expect(markers.some(marker => marker.anchor?.selections?.[0]?.page === 8)).to.equal(
              true
            );
          });
      });
    });

    it('calls onPointClick when a cluster point is clicked', () => {
      Basic.args.onPointClick = cy.stub().as('onPointClick');
      mountBasicStory();

      openMainCluster();
      clickPerson1InMainCluster();

      cy.get('@onPointClick').should('have.been.calledOnce');
      cy.get('@onPointClick').its('firstCall.args.0.target.title').should('eq', 'Person 1');
    });

    it('calls onPointClick when a standalone marker is clicked', () => {
      Basic.args.onPointClick = cy.stub().as('onPointClick');
      mountBasicStory();

      clickStandalonePerson2();

      cy.get('@onPointClick').should('have.been.calledOnce');
      cy.get('@onPointClick').its('firstCall.args.0.target.title').should('eq', 'Person 2');
    });

    it('renders the active marker with expanded styling', () => {
      mount(
        <ThemeProvider>
          {Basic({
            locale: 'en',
            fileUrl: '/api/files/sample.pdf',
            activeRelationshipId: 'ref-partner-1',
          })}
        </ThemeProvider>
      );
      cy.get('.page[data-page-number="1"]', { timeout: 20000 }).should('exist');
      cy.get('[data-testid="rail-marker-cluster"]', { timeout: 20000 }).should('exist');

      cy.get('[data-marker-id="ref-partner-1"]', { timeout: 20000 })
        .find('[data-testid="rail-marker-dot"]')
        .should('have.css', 'width', '14px')
        .should($dot => {
          expect($dot.css('box-shadow')).to.not.equal('none');
        });
    });
  });
});
