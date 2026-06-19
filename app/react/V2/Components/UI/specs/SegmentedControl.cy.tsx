import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Components/UI/SegmentedControl.stories.js';

const { OptionsApi, Disabled } = composeStories(stories);

describe('SegmentedControl', () => {
  it('should be accessible', () => {
    mount(<OptionsApi />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should select a segment on click', () => {
    mount(<OptionsApi />);
    cy.get('[aria-label="List"]').should('have.attr', 'aria-checked', 'true');
    cy.get('[aria-label="Graph"]').click();
    cy.get('[aria-label="Graph"]').should('have.attr', 'aria-checked', 'true');
    cy.get('[aria-label="List"]').should('have.attr', 'aria-checked', 'false');
  });

  it('should move selection with arrow keys', () => {
    mount(<OptionsApi />);
    cy.get('[role="radiogroup"]').as('group');
    cy.get('[aria-label="List"]').focus();
    cy.get('@group').trigger('keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    cy.get('[aria-label="Tree"]').should('have.attr', 'aria-checked', 'true');
    cy.get('@group').trigger('keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    cy.get('[aria-label="Graph"]').should('have.attr', 'aria-checked', 'true');
    cy.get('@group').trigger('keydown', { key: 'Home', code: 'Home' });
    cy.get('[aria-label="List"]').should('have.attr', 'aria-checked', 'true');
  });

  it('should not change selection when disabled', () => {
    mount(<Disabled />);
    cy.get('[aria-label="Tree"]').click({ force: true });
    cy.get('[aria-label="List"]').should('have.attr', 'aria-checked', 'true');
    cy.get('[aria-label="Tree"]').should('have.attr', 'aria-checked', 'false');
  });
});
