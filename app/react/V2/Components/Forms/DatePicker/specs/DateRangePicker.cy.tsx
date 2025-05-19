import React from 'react';
import moment from 'moment-timezone';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import { DateRangePickerComponent } from '../DateRangePickerComponent';
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

  it('should execute date selected events when a date is selected', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('input[placeholder="Inicio"]').should('exist');
    cy.get('#from', { timeout: 3000 }).click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();
    cy.get('@onChange').should('have.been.called');

    cy.get('#to').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('17').click();
    cy.get('@onChange').should('have.been.called');

    checkSelectedDate('#from', '12');
    checkSelectedDate('#to', '17');
  });

  it('should select the current day', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');

    cy.get('#to').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');

    checkSelectedDate('#from', today.getDate().toString().padStart(2, '0'));
    checkSelectedDate('#to', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the selected date by the button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Limpiar').click();
    cy.get('@onChange').should('have.been.called');
  });

  it('should clear the selected date by the action in the input', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.contains('Hoy').click();
    cy.get('div[date-rangepicker=true]')
      .eq(0)
      .within(() => {
        cy.get('button[data-testid=clear-field-button]').eq(0).click();
      });
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');
  });

  it('should handle disabled state', () => {
    mount(<Basic disabled />);
    cy.get('#from').should('be.disabled');
    cy.get('#to').should('be.disabled');
  });

  it('should handle error state', () => {
    mount(<Basic hasErrors={true} errorMessage="This field is required" />);
    cy.get('#from').parent().parent().should('have.class', '[&>div>*:nth-child(odd)]:border-error-300');
    cy.get('#to').parent().parent().should('have.class', '[&>div>*:nth-child(odd)]:border-error-300');
    cy.contains('This field is required').should('be.visible');
  });

  describe('when useTimezone is true', () => {
    it('should render without transforming the value to local', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(
        <Basic
          value={{ from: date.format('YYYY-MM-DD'), to: date.format('YYYY-MM-DD') }}
          useTimezone
        />
      );
      cy.get('#from').should('have.value', date.format('DD-MM-YYYY'));
      cy.get('#to').should('have.value', date.format('DD-MM-YYYY'));
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
        const onChange = cy.stub().as('onChange');
        const newDate = moment.utc(dateToTest);
        mount(
          <Basic
            value={{ from: newDate.format('YYYY-MM-DD'), to: newDate.format('YYYY-MM-DD') }}
            onChange={onChange}
          />
        );

        cy.get('#from').should('have.value', moment(dateToTest).format('DD-MM-YYYY'));
        cy.get('#to').should('have.value', moment(dateToTest).format('DD-MM-YYYY'));

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
    it('should render dates in latin format', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(
        <Basic
          value={{ from: date.format('YYYY-MM-DD'), to: date.format('YYYY-MM-DD') }}
          locale="ar"
        />
      );
      cy.get('#from').should('have.value', '28-07-2016');
      cy.get('#to').should('have.value', '28-07-2016');
    });

    it('should handle date selection correctly', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <Basic
          onChange={onChange}
          locale="ar"
        />
      );

      cy.get('#from').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('12').click();
        });
      cy.get('@onChange').should('have.been.called');
    });
  });

  describe('when using endOfDay flag', () => {
    it('should set the value to the end of the day', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} endOfDay />);
      cy.get('input[name=dateField]').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('12').click();
        });
      cy.get('@onChange').should('have.been.called');
    });
  });

  describe('when used with react-redux-form', () => {
    it('should handle date selection correctly in form context', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <Basic
          model="metadata.dateField"
          onChange={onChange}
          locale="es"
          format="dd-mm-yyyy"
          labelToday="Hoy"
          labelClear="Limpiar"
          placeholderStart="Seleccione una fecha"
          placeholderEnd="Seleccione una fecha"
          hideLabel={true}
          className=""
          useTimezone={true}
        />
      );

      cy.get('input[name="metadata.dateField.from"]').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('1').click();
        });
      cy.wait(1000);

      cy.get('@onChange').should('have.been.called');

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const formattedDate = moment(firstDay).format("DD-MM-yyyy")
      cy.get('input[name="metadata.dateField.from"]').should('have.value', formattedDate);
    });

    it('should handle date input correctly in form context', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <Basic
          model="metadata.dateField"
          onChange={onChange}
          locale="es"
          format="dd-mm-yyyy"
          labelToday="Hoy"
          labelClear="Limpiar"
          hideLabel={true}
          className=""
          useTimezone={true}
        />
      );

      cy.get('input[name="metadata.dateField.from"]').type('01-04-2005', { delay: 0 });
      cy.wait(1000);

      cy.get('@onChange').should('have.been.called');

      cy.get('input[name="metadata.dateField.from"]').should('have.value', '01-04-2005');
    });
  });
});
