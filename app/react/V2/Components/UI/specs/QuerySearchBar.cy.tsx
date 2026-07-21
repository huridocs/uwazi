import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Components/UI/QuerySearchBar.stories.js';

const { Basic } = composeStories(stories);

describe('QuerySearchBar', () => {
  it('should be accessible', () => {
    mount(<Basic />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should update the query when typing', () => {
    mount(<Basic />);
    cy.get('[aria-label="Search"]').type('witness');
    cy.get('[aria-label="Search"]').should('have.value', 'witness');
  });

  it('should clear the query and refocus the input', () => {
    mount(<Basic />);
    cy.get('[aria-label="Search"]').type('witness');
    cy.get('[aria-label="Clear search"]').click();
    cy.get('[aria-label="Search"]').should('have.value', '').and('be.focused');
    cy.get('[aria-label="Clear search"]').should('not.exist');
  });

  it('should toggle search tips', () => {
    mount(<Basic />);
    cy.get('button[aria-label="Search tips"]').click();
    cy.get('[role="dialog"][aria-label="Search tips"]').should('be.visible');
    cy.contains('AND OR NOT').should('be.visible');
    cy.get('button[aria-label="Search tips"]').click();
    cy.get('[role="dialog"][aria-label="Search tips"]').should('not.exist');
  });

  it('should close search tips when clicking outside', () => {
    mount(<Basic />);
    cy.get('button[aria-label="Search tips"]').click();
    cy.get('[role="dialog"][aria-label="Search tips"]').should('be.visible');
    cy.get('body').click(0, 0);
    cy.get('[role="dialog"][aria-label="Search tips"]').should('not.exist');
  });
});
