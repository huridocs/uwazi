import React from 'react';
import { mount } from 'cypress/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { DocumentSelectionFloatingMenu } from '../DocumentSelectionFloatingMenu.js';

const selection: TextSelection = {
  text: 'selected',
  selectionRectangles: [{ top: 40, left: 80, width: 60, height: 12, regionId: '1' }],
};

const nearRightSelection: TextSelection = {
  text: 'edge',
  selectionRectangles: [{ top: 20, left: 340, width: 40, height: 8, regionId: '1' }],
};

const ensurePageContainer = (left = 100, top = 120, width = 400, height = 500) => {
  cy.document().then(doc => {
    let page = doc.getElementById('page-1-container');
    if (!page) {
      page = doc.createElement('div');
      page.id = 'page-1-container';
      doc.body.appendChild(page);
    }
    Object.assign(page.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
  });
};

const mountMenu = (
  props: Partial<React.ComponentProps<typeof DocumentSelectionFloatingMenu>> = {}
) => {
  const onCreateRelationship = cy.stub().as('createRelationship');
  const onAddToToC = cy.stub().as('addToToC');
  const onFillFromSelection = cy.stub().as('fillFromSelection');
  mount(
    <DocumentSelectionFloatingMenu
      selection={selection}
      onCreateRelationship={onCreateRelationship}
      onAddToToC={onAddToToC}
      onFillFromSelection={onFillFromSelection}
      {...props}
    />
  );
};

describe('DocumentSelectionFloatingMenu', () => {
  beforeEach(() => {
    ensurePageContainer();
  });

  it('shows Create relationship and Add to ToC when unarmed', () => {
    mountMenu();

    cy.get('[data-testid="fill-from-selection"]').should('not.exist');
    cy.get('[data-testid="document-selection-floating-menu"]')
      .find('button')
      .should('have.length', 2);
    cy.contains('button', 'Create relationship').should('be.visible').click();
    cy.get('@createRelationship').should('have.been.calledOnce');
    cy.contains('button', 'Add to ToC').should('be.visible').click();
    cy.get('@addToToC').should('have.been.calledOnce');
  });

  it('leads with Fill when armed and keeps other actions', () => {
    mountMenu({ armedLabel: 'Description' });

    cy.get('[data-testid="document-selection-floating-menu"]')
      .find('button')
      .should('have.length', 3)
      .first()
      .should('have.attr', 'data-testid', 'fill-from-selection')
      .and('contain.text', 'Fill')
      .and('contain.text', 'Description');

    cy.get('[data-testid="fill-from-selection"]').find('svg path[d="M9 7v10"]').should('exist');

    cy.get('[data-testid="fill-from-selection"]').click();
    cy.get('@fillFromSelection').should('have.been.calledOnce');
    cy.contains('button', 'Create relationship').click();
    cy.get('@createRelationship').should('have.been.calledOnce');
    cy.contains('button', 'Add to ToC').click();
    cy.get('@addToToC').should('have.been.calledOnce');
  });

  it('portals into document.body with fixed chrome host', () => {
    mountMenu({ armedLabel: 'Title' });

    cy.get('body > [data-testid="document-selection-floating-menu"]')
      .should('have.class', 'tw-content')
      .and('have.class', 'tw-content--chrome')
      .and('have.css', 'position', 'fixed')
      .then($menu => {
        const rect = $menu[0].getBoundingClientRect();
        expect(rect.width).to.be.greaterThan(0);
        expect(rect.width).to.be.lessThan(window.innerWidth);
      });
  });

  it('stays inside the viewport near the page right edge', () => {
    ensurePageContainer(200, 80, 400, 400);
    cy.viewport(800, 600);
    mountMenu({ selection: nearRightSelection, armedLabel: 'Date' });

    cy.get('[data-testid="document-selection-floating-menu"]').then($menu => {
      const rect = $menu[0].getBoundingClientRect();
      expect(rect.left).to.be.at.least(0);
      expect(rect.right).to.be.at.most(800);
      expect(rect.top).to.be.at.least(0);
      expect(rect.bottom).to.be.at.most(600);
    });
    cy.contains('button', 'Fill Date').should('be.visible');
  });

  it('does not render when the page container is missing', () => {
    cy.document().then(doc => {
      doc.getElementById('page-1-container')?.remove();
    });
    mountMenu();
    cy.get('[data-testid="document-selection-floating-menu"]').should('not.exist');
  });
});
