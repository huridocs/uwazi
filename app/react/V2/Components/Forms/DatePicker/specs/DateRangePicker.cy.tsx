import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import moment from 'moment-timezone';
import * as stories from '../../../../../stories/Forms/DateRangePicker.stories';

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

  describe('when useTimezone is true', () => {
    it('should render without transforming the value to local', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<Basic value={{from:date.format('YYYY-MM-DD'), to:date.format('YYYY-MM-DD')}} useTimezone />);
      cy.get('#from').should('have.value', date.format('DD-MM-YYYY'));
    });
  });

  describe('when date is in a different timezone', () => {
    const testTimezones = [
      { timezone: 'Japan', dateToTest: '1950-08-05' },
      { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
      { timezone: 'Europe/Madrid', dateToTest: '2020-08-18' },
    ];

    testTimezones.forEach(({ timezone, dateToTest }) => {
      it(`should handle dates correctly in ${timezone}`, () => {
        const onFromDateSelected = cy.stub().as('onFromDateSelected');
        const newDate = moment.utc(dateToTest);
        mount(<Basic value={{from:newDate.format('YYYY-MM-DD'), to:newDate.format('YYYY-MM-DD')}} onFromDateSelected={onFromDateSelected} />);
        
        // Check initial value
        cy.get('#from').should(
          'have.value',
          moment(dateToTest).format('DD-MM-YYYY')
        );

        // Test date selection
        cy.get('#from').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('12').click();
          });
        cy.get('@onFromDateSelected').should('have.been.called');
      });
    });
  });

  describe('when using a non-latin locale', () => {
    beforeEach(() => {
      moment.locale('ar');
    });

    afterEach(() => {
      moment.locale('en');
    });

    it('should render dates in latin format', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<Basic value={{from:date.format('YYYY-MM-DD'), to:date.format('YYYY-MM-DD')}} locale="ar" />);
      cy.get('#from').should(
        'have.value',
        moment('2016-07-28').locale('en').format('DD-MM-YYYY')
      );
    });

    it('should handle date selection correctly', () => {
      const onFromDateSelected = cy.stub().as('onFromDateSelected');
      mount(<Basic onFromDateSelected={onFromDateSelected} locale="ar" />);
      cy.get('#from').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('12').click();
        });
      cy.get('@onFromDateSelected').should('have.been.called');
    });
  });
});
