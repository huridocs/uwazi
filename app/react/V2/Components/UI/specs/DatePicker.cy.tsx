import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/DatePicker.stories';

const { Basic } = composeStories(stories);

describe('DatePicker', () => {
  const today = new Date();
  const checkSelectedDate = (selector: string, day: string) => {
    cy.get(selector).should(
      'have.value',
      `${day}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
    );
  };

  it('should be accessible', () => {
    cy.injectAxe();

    mount(<Basic />);
    cy.checkA11y();
  });

  it('should execute onChange when a date is selected', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.get('.days')
      .eq(0)
      .within(() => {
        cy.contains('12').click();
      });
    cy.get('@onChange').should('have.been.called');
  });

  it('should select today by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    cy.get('@onChange').should('have.been.called');
    checkSelectedDate('input[name=dateField]', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the date by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    cy.get('input[name=dateField]').click();
    cy.contains('Limpiar').click();
    cy.get('@onChange').should('have.been.called');
    cy.get('input[name=dateField]').should('have.value', '');
  });
});
