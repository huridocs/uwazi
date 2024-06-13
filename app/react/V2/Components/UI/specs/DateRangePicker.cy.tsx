import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/DateRangePicker.stories';

const { Basic } = composeStories(stories);

describe('DateRangePicker', () => {
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

  // eslint-disable-next-line max-statements
  it('should execute date selected events when a date is selected', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');
    const onToDateSelected = cy.stub().as('onToDateSelected');
    mount(<Basic onFromDateSelected={onFromDateSelected} onToDateSelected={onToDateSelected} />);
    cy.get('input[placeholder*="Inicio"]').click();
    cy.contains('12')
      .eq(0)
      .within(() => {
        cy.contains('12').click();
      });
    cy.get('@onFromDateSelected').should('have.been.called');
    cy.get('#to').click();
    cy.get('.days')
      .eq(1)
      .within(() => {
        cy.contains('17').click();
      });

    cy.get('@onToDateSelected').should('have.been.called');
    checkSelectedDate('#from', '12');
    checkSelectedDate('#to', '17');
  });

  it('should select the current day', () => {
    mount(<Basic />);
    cy.get('input[placeholder*="Inicio"]').click();
    cy.contains('Hoy').click();
    checkSelectedDate('#from', today.getDate().toString().padStart(2, '0'));
    checkSelectedDate('#to', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the selected date by the button', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');
    mount(<Basic onFromDateSelected={onFromDateSelected} />);
    cy.get('input[placeholder*="Inicio"]').click();
    cy.contains('Hoy').click();
    cy.get('input[placeholder*="Inicio"]').click();
    cy.contains('Limpiar').click();
    cy.get('@onFromDateSelected').should('have.been.called');
  });

  it('should clear the selected date by the action in the input', () => {
    const onFromDateSelected = cy.stub().as('onClear');
    mount(<Basic onFromDateSelected={onFromDateSelected} />);
    cy.get('input[placeholder*="Inicio"]').click();
    cy.contains('Hoy').click();
    cy.get('div[date-rangepicker=true]')
      .eq(0)
      .within(() => {
        cy.get('button[data-testid=clear-field-button]').eq(0).click();
      });
    cy.get('@onClear').should('have.been.called');
  });
});
