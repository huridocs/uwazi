import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/MultiSelect.stories';

const { Basic: MultiSelect } = composeStories(stories);

describe('MultiSelect', () => {
  beforeEach(() => {
    mount(<MultiSelect />);
  });

  it('should render context menu when button clicked', () => {
    cy.get('[data-testid="multiselect-comp"] button').click();
    cy.get('ul li').should('have.length', 4);
  });

  describe('Main area', () => {
    beforeEach(() => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('ul li').get('input').eq(1).click();
      cy.get('ul li').get('input').eq(2).click();
    });

    it('should display selected options in the main area', () => {
      cy.get('[data-testid="pill-comp"]').should('have.length', 2);
    });

    it('should remove an option when unchecked', () => {
      cy.get('[data-testid="pill-comp"]')
        .eq(0)
        .within(() => {
          cy.get('button').click();
        });
      cy.get('[data-testid="pill-comp"]').should('have.length', 1);
    });
  });
});
