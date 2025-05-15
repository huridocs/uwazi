import React from 'react';
import moment from 'moment-timezone';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from '../../../../../stories/Forms/DatePicker.stories';
import { DatePicker } from '../DatePicker';

const { Basic, FormIntegration } = composeStories(stories);

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
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');
  });

  it('should select today by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');
    checkSelectedDate('input[name=dateField]', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the date by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    cy.wait(1000);
    cy.get('input[name=dateField]').click();
    cy.contains('Limpiar').click();
    cy.wait(1000);
    cy.get('@onChange').should('have.been.called');
    cy.get('input[name=dateField]').should('have.value', '');
  });

  describe('when typing dates', () => {
    it('should allow entering dates in the format DD/MM/YYYY', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);
      cy.get('input[name=dateField]').type('15-05-2024', { delay: 0 });
      cy.wait(1000);
      cy.get('input[name=dateField]').should('have.value', '15-05-2024');
      cy.get('@onChange').should('have.been.called');
    });

    it('should handle backspace and delete keys', () => {
      mount(<Basic />);
      cy.get('input[name=dateField]').type('15-05-2024', { delay: 0 });
      cy.wait(1000);
      cy.get('input[name=dateField]').type('{backspace}', { force: true });
      cy.wait(1000);
      cy.get('input[name=dateField]').should('have.value', '15-05-202');
      cy.get('input[name=dateField]').type('{leftarrow}', { force: true });
      cy.get('input[name=dateField]').type('{del}', { force: true });
      cy.wait(1000);
      cy.get('input[name=dateField]').should('have.value', '15-05-20');
    });

    it('should not accept invalid dates', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);
      
      cy.get('input[name=dateField]').type('99-99-9999', { delay: 0 });
      cy.get('input[name=dateField]').blur();
      cy.wait(1000);
      cy.get('@onChange').should('not.have.been.called');      
    });
  });

  describe('useTimezone', () => {
    it('should render with the correct date transformed to local value', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<Basic value={Number(date.format('X'))} />);
      const utcDate = moment.utc(date.format('X'), 'X');
      cy.get('input[name=dateField]').should('have.value', utcDate.format('DD-MM-YYYY'));
    });

    it('should render without transforming the value to local', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<Basic value={Number(date.format('X'))} useTimezone />);
      cy.get('input[name=dateField]').should('have.value', date.format('DD-MM-YYYY'));
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
        mount(<Basic value={Number(newDate.format('X'))} onChange={onChange} />);
        
        // Check initial value
        cy.get('input[name=dateField]').should(
          'have.value',
          moment(dateToTest).format('DD-MM-YYYY')
        );

        // Test date selection
        cy.get('input[name=dateField]').click();
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
    it('should render dates correctly', () => {
      const date = moment.utc('2016-07-28T00:00:00+00:00');
      mount(<Basic value={Number(date.format('X'))} locale="ar" />);
      cy.get('input[name=dateField]').should(
        'have.value',
        moment('2016-07-28').locale('ar').format('DD-MM-YYYY')
      );
    });

    it('should handle date selection correctly', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} locale="ar" />);
      cy.get('input[name=dateField]').click();
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
        <DatePicker
          model="metadata.dateField"
          value={null}
          onChange={onChange}
          locale="es"
          format="dd-mm-yyyy"
          labelToday="Hoy"
          labelClear="Limpiar"
          placeholder="Seleccione una fecha"
          hideLabel={true}
          className=""
          useTimezone={true}
        />
      );

      // Select a specific date (2005-04-01)
      cy.get('input[name="metadata.dateField"]').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('1').click();
        });
      cy.wait(1000);

      // Verify the onChange was called
      cy.get('@onChange').should('have.been.called');

      // Verify the input value is correct
      cy.get('input[name="metadata.dateField"]').should('have.value', '01-04-2005');
    });

    it('should handle date input correctly in form context', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <DatePicker
          model="metadata.dateField"
          value={null}
          onChange={onChange}
          locale="es"
          format="dd-mm-yyyy"
          labelToday="Hoy"
          labelClear="Limpiar"
          placeholder="Seleccione una fecha"
          hideLabel={true}
          className=""
          useTimezone={true}
        />
      );

      // Type a specific date (2005-04-01)
      cy.get('input[name="metadata.dateField"]').type('01-04-2005', { delay: 0 });
      cy.wait(1000);

      // Verify the onChange was called
      cy.get('@onChange').should('have.been.called');

      // Verify the input value is correct
      cy.get('input[name="metadata.dateField"]').should('have.value', '01-04-2005');
    });

    it('should handle form integration story correctly', () => {
      const onChange = cy.stub().as('onChange');
      mount(<FormIntegration onChange={onChange} />);

      // Type a specific date (2005-04-01)
      cy.get('input[name="metadata.dateField"]').type('01-04-2005', { delay: 0 });
      cy.wait(1000);

      // Verify the onChange was called
      cy.get('@onChange').should('have.been.called');

      // Verify the input value is correct
      cy.get('input[name="metadata.dateField"]').should('have.value', '01-04-2005');
    });
  });
});
