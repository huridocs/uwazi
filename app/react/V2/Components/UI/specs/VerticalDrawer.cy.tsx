import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/VerticalDrawer.stories.js';

const { Basic } = stories;

describe('VerticalDrawer', () => {
  it('should be accessible', () => {
    cy.injectAxe();
    mount(<Basic.Component />);
    cy.checkA11y();
  });

  it('should render closed by default', () => {
    mount(<Basic.Component />);
    cy.contains('button', 'Open').should('be.visible');
    cy.get('[data-testid="drawer-content"]').should('not.be.visible');
  });

  it('should render open based on props', () => {
    Basic.composed.args.defaultOpen = true;
    mount(<Basic.Component />);
    cy.contains('button', 'Close').should('be.visible');
    cy.get('[data-testid="drawer-content"]').should('be.visible');
  });

  it('should toggle content visibility when button is clicked', () => {
    Basic.composed.args.defaultOpen = false;
    mount(<Basic.Component />);
    cy.contains('button', 'Open').click();
    cy.get('[data-testid="drawer-content"]').should('be.visible');
    cy.contains('button', 'Close').click();
    cy.get('[data-testid="drawer-content"]').should('not.be.visible');
  });
});
