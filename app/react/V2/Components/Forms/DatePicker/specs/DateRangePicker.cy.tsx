import React from 'react';
import moment from 'moment-timezone';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import { DateRangePickerComponent } from '../DateRangePickerComponent';
import * as stories from '../../../../../stories/Forms/DatePicker.stories';

const { DateRangeBasic } = composeStories(stories);

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

    mount(<DateRangeBasic />);
    cy.checkA11y();
  });

  it('should execute date selected events when a date is selected', () => {
    const onChange = cy.stub().as('onChange');
    mount(<DateRangeBasic onChange={onChange} />);
    cy.get('input[placeholder="Inicio"]').should('exist');
    cy.get('#from', { timeout: 3000 }).click();
    cy.contains('12')
      .eq(0)
      .within(() => {
        cy.contains('12').click();
      });
    cy.get('@onChange').should('have.been.called');
    cy.get('#to').click();
    cy.get('.days')
      .eq(1)
      .within(() => {
        cy.contains('17').click();
      });

    checkSelectedDate('#from', '12');
    checkSelectedDate('#to', '17');
  });

  it('should select the current day', () => {
    mount(<DateRangeBasic />);
    cy.get('#from').click();
    cy.contains('Today').click();
    checkSelectedDate('#from', today.getDate().toString().padStart(2, '0'));
    checkSelectedDate('#to', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the selected date by the button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<DateRangeBasic onChange={onChange} />);
    cy.get('#from').click();
    cy.contains('Today').click();
    cy.get('#from').click();
    cy.contains('Clear').click();
    cy.get('@onChange').should('have.been.called');
  });

  it('should clear the selected date by the action in the input', () => {
    const onChange = cy.stub().as('onChange');
    mount(<DateRangeBasic onChange={onChange} />);
    cy.get('#from').click();
    cy.contains('Today').click();
    cy.get('div[date-rangepicker=true]')
      .eq(0)
      .within(() => {
        cy.get('button[data-testid=clear-field-button]').eq(0).click();
      });
    cy.get('@onChange').should('have.been.called.with', { from: null, to: null });
  });

  it('should handle disabled state', () => {
    mount(<DateRangeBasic disabled />);
    cy.get('#from').should('be.disabled');
    cy.get('#to').should('be.disabled');
  });

  it('should handle error state', () => {
    mount(<DateRangeBasic hasErrors={true} errorMessage="This field is required" />);
    cy.get('#from').parent().parent().should('have.class', '[&>div>*:nth-child(odd)]:border-error-300');
    cy.get('#to').parent().parent().should('have.class', '[&>div>*:nth-child(odd)]:border-error-300');
    cy.contains('This field is required').should('be.visible');
  });

  xit('should handle endOfDay state', () => {
    mount(<DateRangeBasic endOfDay />);
    cy.get('#from').should('have.class', 'border-error-300');
    cy.get('#to').should('have.class', 'border-error-300');
  });

  describe('when useTimezone is true', () => {
    it('should render without transforming the value to local', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<DateRangeBasic value={{ from: date.format('YYYY-MM-DD'), to: date.format('YYYY-MM-DD') }} useTimezone />);
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
        mount(<DateRangeBasic value={{ from: newDate.format('YYYY-MM-DD'), to: newDate.format('YYYY-MM-DD') }} onChange={onChange} />);

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
        cy.get('@onChange').should('have.been.called');
      });
    });
  });

  describe('when using a non-latin locale', () => {
    it('should render dates in latin format', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<DateRangeBasic value={{ from: date.format('YYYY-MM-DD'), to: date.format('YYYY-MM-DD') }} locale="ar" />);
      cy.get('#from').should(
        'have.value',
        moment('2016-07-28').locale('en').format('DD-MM-YYYY')
      );
    });

    it('should handle date selection correctly', () => {
      const onChange = cy.stub().as('onChange');
      mount(<DateRangeBasic onChange={onChange} locale="ar" />);
      cy.get('#from').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('12').click();
        });
      cy.get('@onChange').should('have.been.called');
    });
  });
});
