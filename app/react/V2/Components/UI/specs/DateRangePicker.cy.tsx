import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/DateRangePicker.stories';

const { Basic } = composeStories(stories);

describe('DatePicker', () => {
  it('should be accessible', () => {
    cy.injectAxe();

    mount(<Basic />);
    cy.checkA11y();
  });

  it('should execute onChange when a date is selected', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="From"]').click();
    cy.get('.days')
      .eq(0)
      .within(() => {
        cy.contains('12').click();
      });
    cy.get('@onChange').should('have.been.called');
  });
});
