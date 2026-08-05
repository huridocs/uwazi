import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Components/UI/CollapsibleSectionHeader.stories.js';

const { Grouped, Tree } = composeStories(stories);

describe('CollapsibleSectionHeader', () => {
  it('should be accessible', () => {
    mount(<Grouped />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should toggle grouped section content', () => {
    mount(<Grouped />);
    cy.contains('Mexico → related to → This document').should('be.visible');
    cy.contains('button', 'Person').click();
    cy.contains('Mexico → related to → This document').should('not.exist');
    cy.contains('button', 'Person').click();
    cy.contains('Mexico → related to → This document').should('be.visible');
  });

  it('should toggle tree section content and aria-expanded', () => {
    mount(<Tree />);
    cy.contains('button', 'This document').should('have.attr', 'aria-expanded', 'true');
    cy.contains('button', 'Person').should('be.visible');
    cy.contains('button', 'This document').click();
    cy.contains('button', 'This document').should('have.attr', 'aria-expanded', 'false');
    cy.contains('button', 'Person').should('not.exist');
  });
});
