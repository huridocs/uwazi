import React from 'react';
import moment from 'moment-timezone';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from '../../../../../stories/Forms/DatePicker.stories';

const { Basic } = composeStories(stories);

describe('DatePicker', () => {
  const today = new Date();
  const testDate = moment.utc('2016-07-28T00:00:00+00:00');
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
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('@onChange').should('have.been.called');
  });

  it('should select today by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('@onChange').should('have.been.called');
    checkSelectedDate('input[name=dateField]', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the date by a button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);
    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Hoy').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('input[name=dateField]').click();
    cy.contains('Limpiar').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('@onChange').should('have.been.calledWith', null);
    cy.get('input[name=dateField]').should('have.value', '');
  });

  describe('when typing dates', () => {
    it('should allow entering dates in the format DD-MM-YYYY', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);
      cy.get('input[name=dateField]').type('15-05-2024', { delay: 0 });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('input[name=dateField]').should('have.value', '15-05-2024');
      cy.get('@onChange').should('have.been.called');
    });

    it('should handle backspace and delete keys', () => {
      mount(<Basic />);
      cy.get('input[name=dateField]').type('15-05-2024', { delay: 0 });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('input[name=dateField]').type('{backspace}', { force: true });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('input[name=dateField]').should('have.value', '15-05-202');
      cy.get('input[name=dateField]').type('{leftarrow}', { force: true });
      cy.get('input[name=dateField]').type('{del}', { force: true });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('input[name=dateField]').should('have.value', '15-05-20');
    });

    it('should not accept invalid dates', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);

      cy.get('input[name=dateField]').type('99-99-9999', { delay: 0 });
      cy.get('input[name=dateField]').blur();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('@onChange').should('not.have.been.called');
    });

    it('should handle disabled state', () => {
      mount(<Basic disabled />);
      cy.get('input[name=dateField]').should('be.disabled');
    });

    it('should handle error state', () => {
      mount(<Basic hasErrors={true} errorMessage="This field is required" />);
      cy.get('input[name=dateField]').should('have.class', '!border-red-300');
      cy.contains('This field is required').should('be.visible');
    });
  });

  describe('useTimezone', () => {
    it('should render with the correct date transformed to local value', () => {
      mount(<Basic value={Number(testDate.format('X'))} />);
      const expectedDate = moment(testDate).utc().format('DD-MM-YYYY');
      cy.get('input[name=dateField]').should('have.value', expectedDate);
    });

    it('should render with the correct date from timestamp', () => {
      mount(<Basic value={1747528923} />);
      cy.get('input[name=dateField]').should('have.value', '18-05-2025');
    });

    describe('when useTimezone is true', () => {
      it('should render without transforming the value to local', () => {
        mount(<Basic value={Number(testDate.format('X'))} useTimezone />);
        cy.get('input[name=dateField]').should('have.value', testDate.format('DD-MM-YYYY'));
      });
    });

    describe('when date is in a different timezone', () => {
      const testTimezones = [
        { timezone: 'Japan', dateToTest: '1950-08-05' },
        { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
      ];

      testTimezones.forEach(({ timezone, dateToTest }) => {
        it(`should handle dates correctly in ${timezone}`, () => {
          moment.tz.setDefault(timezone);
          const onChange = cy.stub().as('onChange');
          const newDate = moment.utc(dateToTest);
          mount(<Basic value={Number(newDate.format('X'))} onChange={onChange} />);

          cy.get('input[name=dateField]').should(
            'have.value',
            moment(dateToTest).local().format('DD-MM-YYYY')
          );

          cy.get('input[name=dateField]').click();
          cy.get('.days')
            .eq(0)
            .within(() => {
              cy.contains('20').click();
            });
          cy.get('@onChange').should('have.been.called');
        });
      });
    });

    describe('when using a non-latin locale', () => {
      it('should render dates in latin format', () => {
        const date = moment.utc('2016-07-28T00:00:00+00:00');
        mount(<Basic value={Number(date.format('X'))} locale="ar" />);
        cy.get('input[name=dateField]').should(
          'have.value',
          moment('2016-07-28').local().format('DD-MM-YYYY')
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
    describe('when useTimezone is true (for activity log, etc)', () => {
      it('should set the value to timestamp NOT offsetting to UTC', () => {
        const onChange = cy.stub().as('onChange');
        const newDate = moment('2020-08-18');
        mount(<Basic onChange={onChange} useTimezone />);
        cy.get('input[name=dateField]').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('18').click();
          });
        cy.get('@onChange').should('have.been.called.with', newDate.local().valueOf() / 1000);
      });

      it('should set the value to the end of the day NOT offsetting to UTC', () => {
        const onChange = cy.stub().as('onChange');
        const newDate = moment('2020-08-18');
        mount(<Basic onChange={onChange} useTimezone endOfDay />);
        cy.get('input[name=dateField]').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('18').click();
          });
        cy.get('@onChange').should('have.been.called.with', newDate.local().valueOf() / 1000);
      });
    });
  });

  describe('when used with react-redux-form', () => {
    it('should handle date selection correctly in form context', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <Basic
          model="metadata.dateField"
          onChange={onChange}
          locale="en"
          format="dd-mm-yyyy"
          useTimezone={true}
        />
      );

      cy.get('input[name="metadata.dateField"]').click();
      cy.get('.days')
        .eq(0)
        .within(() => {
          cy.contains('1').click();
        });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      cy.get('@onChange').should('have.been.called');

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const formattedDate = moment(firstDay).utc().format('DD-MM-yyyy');
      cy.get('input[name="metadata.dateField"]').should('have.value', formattedDate);
    });

    it('should handle date input correctly in form context', () => {
      const onChange = cy.stub().as('onChange');
      mount(
        <Basic model="metadata.dateField" onChange={onChange} locale="es" useTimezone={true} />
      );

      cy.get('input[name="metadata.dateField"]').type('01-04-2005', { delay: 0 });
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      cy.get('@onChange').should('have.been.called');

      cy.get('input[name="metadata.dateField"]').should('have.value', '01-04-2005');
    });
  });
});
