import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react-webpack5';
import * as stories from '#app/stories/Components/UI/Drawer.stories.js';

const { Playground, Open } = composeStories(stories);

describe('Drawer', () => {
  it('opens from the trigger and closes via the header button', () => {
    mount(<Playground />);

    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'true');
    cy.get('[data-testid="open-drawer"]').click();
    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'false');
    cy.get('[data-testid="drawer-body"]').should('be.visible');

    cy.get('[data-testid="drawer-close-button"]').click();
    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'true');
  });

  it('closes when Escape is pressed', () => {
    mount(<Open />);

    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'false');
    cy.get('body').trigger('keydown', { key: 'Escape' });
    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'true');
  });

  it('closes when the overlay is clicked', () => {
    mount(<Open />);

    cy.get('[data-testid="drawer-overlay"]').click({ force: true });
    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'true');
  });

  it('has no critical axe violations when open', () => {
    mount(<Open />);

    cy.injectAxe();
    cy.get('#demo-drawer-dialog').should('have.attr', 'aria-hidden', 'false');
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
  });
});
