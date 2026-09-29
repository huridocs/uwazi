/// <reference types="cypress" />
/// <reference types="cypress-real-events" />
/// <reference path="../../../../../../cypress/cypress.d.ts" />
import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/Layouts/PaneLayout.stories.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';

const { Basic } = stories;

describe('PaneLayout', () => {
  const render = ({
    localStorageKey,
    defaultRatios,
  }: {
    localStorageKey?: string;
    defaultRatios?: number[];
  } = {}) => {
    mount(<Basic.Component localStorageKey={localStorageKey} defaultRatios={defaultRatios} />);
  };

  describe('Desktop', () => {
    it('should be accessible', () => {
      render();
      cy.injectAxe();
      cy.get('button[aria-label]')
        .first()
        .should('have.attr', 'type', 'button')
        .and('have.class', 'w-1');
      cy.checkA11y();
    });

    it('should be able to resize panes', () => {
      render();
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('button[aria-label]'), 50, 0);
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 467px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 347px;');
    });

    it('panel should have a minimum size', () => {
      render();
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('button[aria-label]'), 298, 0);
      //resizing will fail if it exceeds the minwidth in cypress.
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
    });

    it('should save pane setup to the localStorage', () => {
      render({ localStorageKey: 'cypressComponentTest' });
      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 407px;');
      cy.realDrag(cy.get('button[aria-label]'), 50, 0);
      cy.getAllLocalStorage().then(result => {
        const host = Object.keys(result)[0];
        expect(result[host].cypressComponentTest).to.equal(
          '[0.3799837266069976,0.2823433685923515,0.33116354759967453]'
        );
      });
      cy.clearAllLocalStorage();
    });

    it('should restore pane configuration from localstorage', () => {
      cy.window().then(window => {
        window.localStorage.setItem('cypressComponentTest', '[0.2,0.2,0.6]');
      });
      render({ localStorageKey: 'cypressComponentTest' });
      cy.get('section')
        .eq(0)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(283.66, 0.5);
        });
      cy.get('section')
        .eq(1)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(283.66, 0.5);
        });
      cy.get('section')
        .eq(2)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(653.67, 0.5);
        });
      cy.clearAllLocalStorage();
    });

    it('should allow passing default widths for panes', () => {
      render({ defaultRatios: [0.2, 0.2, 0.6] });
      cy.get('section')
        .eq(0)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(283.66, 0.5);
        });
      cy.get('section')
        .eq(1)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(283.66, 0.5);
        });
      cy.get('section')
        .eq(2)
        .should($el => {
          expect(parseFloat($el[0].style.width)).to.be.closeTo(653.67, 0.5);
        });
    });

    it('should keep user selected widths when children update', () => {
      const Wrapper = () => {
        const [v, setV] = React.useState(false);
        return (
          <div style={{ height: '768px' }} className="tw-content">
            <button type="button" id="replace" onClick={() => setV(x => !x)}>
              replace
            </button>
            <PaneLayout defaultRatios={[0.4, 0.6]}>
              <PaneLayout.Pane key={`p1-${v ? 'b' : 'a'}`}>
                <div>{v ? 'A2' : 'A1'}</div>
              </PaneLayout.Pane>
              <PaneLayout.Pane key={`p2-${v ? 'b' : 'a'}`}>
                <div>{v ? 'B2' : 'B1'}</div>
              </PaneLayout.Pane>
            </PaneLayout>
          </div>
        );
      };

      mount(<Wrapper />);

      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 491.6px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 737.4px;');

      cy.realDrag(cy.get('button[aria-label]'), 100, 0);

      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 600px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 629px;');

      cy.get('#replace').click();

      cy.get('section').eq(0).should('have.attr', 'style').and('equal', 'width: 600px;');
      cy.get('section').eq(1).should('have.attr', 'style').and('equal', 'width: 629px;');
    });
  });

  describe('mobile', { viewportWidth: 450, viewportHeight: 650 }, () => {
    it('should pass the accessibility check', () => {
      render();
      cy.injectAxe();
      cy.checkA11y();
    });

    it('keeps the first pane on the page and opens later panes as sheets', () => {
      const Wrapper = () => {
        const [requestedPane, setRequestedPane] = React.useState<
          { index: number; id: number } | undefined
        >();
        const open = (index: number) =>
          setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
        return (
          <div style={{ height: '650px' }} className="tw-content">
            <button type="button" id="open-pane" onClick={() => open(1)}>
              open pane
            </button>
            <button type="button" id="open-deep" onClick={() => open(2)}>
              open deep
            </button>
            <PaneLayout requestedPane={requestedPane}>
              <PaneLayout.Pane>
                <p>Aenean ac purus nulla.</p>
              </PaneLayout.Pane>
              <PaneLayout.Pane>
                <h2>This pane children has a min width</h2>
              </PaneLayout.Pane>
              <PaneLayout.Pane>
                <p>Third pane</p>
              </PaneLayout.Pane>
            </PaneLayout>
          </div>
        );
      };

      mount(<Wrapper />);
      cy.contains('Aenean ac purus nulla.').should('be.visible');
      cy.contains('h2', 'This pane children has a min width').should('not.exist');
      cy.get('button[aria-label="Previous"]').should('not.exist');
      cy.get('button[aria-label="Next"]').should('not.exist');
      cy.get('#open-pane').click();
      cy.get('[role="dialog"]')
        .contains('h2', 'This pane children has a min width')
        .should('be.visible');
      cy.get('[data-part="close"]').click();
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('Aenean ac purus nulla.').should('be.visible');
      cy.get('#open-deep').click();
      cy.get('[role="dialog"]').should('have.length', 2);
      cy.contains('button', 'Close all').should('be.visible').click();
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('Aenean ac purus nulla.').should('be.visible');
    });
  });
});
