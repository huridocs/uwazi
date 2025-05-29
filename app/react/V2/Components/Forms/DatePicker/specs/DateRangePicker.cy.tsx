import React from 'react';
import moment from 'moment-timezone';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from '../../../../../stories/Forms/DateRangePicker.stories';

const { Basic } = composeStories(stories);

describe('DateRangePicker', () => {
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

  it('should execute date selected events when a date is selected', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('input[placeholder="Inicio"]').should('exist');
    cy.get('#from', { timeout: 3000 }).click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();
    cy.get('@onChange').should('have.been.calledWith', {
      from: Cypress.sinon.match.number,
      to: null,
    });

    cy.get('#to').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('17').click();
    cy.get('@onChange').should('have.been.calledWith', {
      from: Cypress.sinon.match.number,
      to: Cypress.sinon.match.number,
    });

    checkSelectedDate('#from', '12');
    checkSelectedDate('#to', '17');
  });

  it('should select the current day', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    cy.get('@onChange').should('have.been.calledWith', {
      from: Cypress.sinon.match.number,
      to: null,
    });

    cy.get('#to').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    cy.get('@onChange').should('have.been.calledWith', {
      from: Cypress.sinon.match.number,
      to: Cypress.sinon.match.number,
    });

    checkSelectedDate('#from', today.getDate().toString().padStart(2, '0'));
    checkSelectedDate('#to', today.getDate().toString().padStart(2, '0'));
  });

  it('should clear the selected date by the button', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Limpiar').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('@onChange')
      .should('have.been.calledTwice')
      .then(function () {
        const stub = this.onChange;
        const firstCallArgs = stub.args[0][0];
        const secondCallArgs = stub.args[1][0];

        expect(firstCallArgs.from).to.be.a('number');
        expect(firstCallArgs.to).to.equal(null);

        expect(secondCallArgs.from).to.equal(null);
        expect(secondCallArgs.to).to.equal(null);
      });
  });

  it('should clear the selected date by the action in the input', () => {
    const onChange = cy.stub().as('onChange');
    mount(<Basic onChange={onChange} />);

    cy.get('#from').click();
    cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Hoy').click();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('div[date-rangepicker=true]')
      .eq(0)
      .within(() => {
        cy.get('button[data-testid=clear-field-button]').eq(0).click();
      });
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get('@onChange').should('have.been.calledWith', {
      from: null,
      to: null,
    });
  });

  it('should handle disabled state', () => {
    mount(<Basic disabled />);
    cy.get('#from').should('be.disabled');
    cy.get('#to').should('be.disabled');
  });

  it('should handle error state', () => {
    mount(<Basic hasErrors={true} errorMessage="This field is required" />);
    cy.get('#from').should('have.class', 'border-red-300');
    cy.get('#to').should('have.class', 'border-red-300');
    cy.contains('This field is required').should('be.visible');
  });

  describe('useTimezone', () => {
    it('should render with the correct date transformed to local value', () => {
      mount(
        <Basic value={{ from: Number(testDate.format('X')), to: Number(testDate.format('X')) }} />
      );
      const expectedDate = moment('2016-07-28').format('DD-MM-YYYY');
      cy.get('#from').should('have.value', expectedDate);
      cy.get('#to').should('have.value', expectedDate);
    });

    describe('when useTimezone is true', () => {
      it('should render without transforming the value to local', () => {
        mount(
          <Basic
            value={{ from: Number(testDate.format('X')), to: Number(testDate.format('X')) }}
            useTimezone
          />
        );
        cy.get('#from').should('have.value', testDate.format('DD-MM-YYYY'));
        cy.get('#to').should('have.value', testDate.format('DD-MM-YYYY'));
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

          const fromDate = moment.utc(dateToTest);
          const toDate = moment.utc(dateToTest).add(2, 'day');
          mount(
            <Basic
              value={{ from: Number(fromDate.format('X')), to: Number(toDate.format('X')) }}
              onChange={onChange}
            />
          );

          cy.get('#from').should('have.value', moment(dateToTest).local().format('DD-MM-YYYY'));
          cy.get('#to').should(
            'have.value',
            moment(dateToTest).local().add(2, 'day').format('DD-MM-YYYY')
          );

          cy.get('#to').click();
          cy.get('.datepicker.datepicker-dropdown:not(.hidden)').within(() => {
            cy.contains('20').click();
          });
          cy.get('@onChange').should('have.been.calledWith', {
            from: Cypress.sinon.match.number,
            to: Cypress.sinon.match.number,
          });
        });
      });
    });

    describe('when using a non-latin locale', () => {
      it('should render dates in latin format', () => {
        const date = moment.utc('2016-07-28T00:00:00+00:00');
        mount(
          <Basic
            value={{ from: Number(date.format('X')), to: Number(date.format('X')) }}
            locale="ar"
          />
        );
        cy.get('#from').should('have.value', moment('2016-07-28').local().format('DD-MM-YYYY'));
        cy.get('#to').should('have.value', moment('2016-07-28').local().format('DD-MM-YYYY'));
      });

      it('should handle date selection correctly', () => {
        const onChange = cy.stub().as('onChange');
        mount(<Basic onChange={onChange} locale="ar" />);
        cy.get('#from').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('12').click();
          });
        cy.get('@onChange').should('have.been.calledWith', {
          from: Cypress.sinon.match.number,
          to: null,
        });
      });
    });

    describe('when using endOfDay flag', () => {
      it('should set the value to the end of the day', () => {
        const onChange = cy.stub().as('onChange');
        mount(<Basic onChange={onChange} endOfDay />);
        cy.get('#from').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('12').click();
          });
        cy.get('@onChange').should('have.been.calledWith', {
          from: Cypress.sinon.match.number,
          to: null,
        });
      });
    });

    describe('when useTimezone is true (for activity log, etc)', () => {
      it('should set the value to timestamp NOT offsetting to UTC', () => {
        const onChange = cy.stub().as('onChange');
        mount(<Basic onChange={onChange} useTimezone />);
        cy.get('#from').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('18').click();
          });
        cy.get('@onChange').should('have.been.calledWith', {
          from: Cypress.sinon.match.number,
          to: null,
        });
      });

      it('should set the value to the end of the day NOT offsetting to UTC', () => {
        const onChange = cy.stub().as('onChange');
        mount(<Basic onChange={onChange} useTimezone endOfDay />);
        cy.get('#from').click();
        cy.get('.days')
          .eq(0)
          .within(() => {
            cy.contains('18').click();
          });
        cy.get('@onChange').should('have.been.calledWith', {
          from: Cypress.sinon.match.number,
          to: null,
        });
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
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: null,
      });

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const formattedDate = moment(firstDay).format('DD-MM-yyyy');
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
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);

      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: null,
      });

      cy.get('input[name="metadata.dateField.from"]').should('have.value', '01-04-2005');
    });
  });

  describe('Event value validation', () => {
    it('should pass correct timestamp values in onChange event', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);

      cy.get('#from').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();

      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: null,
      });

      cy.get('#to').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('17').click();

      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: Cypress.sinon.match.number,
      });

      cy.get('#from').should(
        'have.value',
        `12-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
      );
      cy.get('#to').should(
        'have.value',
        `17-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
      );
    });

    it('should handle clearing dates and pass null values', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);

      cy.get('#from').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();
      cy.get('#to').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('17').click();

      cy.get('#from').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Limpiar').click();

      cy.get('@onChange').should('have.been.calledWith', {
        from: null,
        to: Cypress.sinon.match.number,
      });

      cy.get('#to').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('Limpiar').click();

      cy.get('@onChange').should('have.been.calledWith', {
        from: null,
        to: null,
      });

      cy.get('#from').should('have.value', '');
      cy.get('#to').should('have.value', '');
    });
  });

  describe('Range validation', () => {
    it('should allow selecting dates in correct order', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);

      cy.get('#from').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();

      cy.get('#to').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('17').click();

      cy.get('#from').should(
        'have.value',
        `12-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
      );
      cy.get('#to').should(
        'have.value',
        `17-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
      );
    });

    it('should handle invalid date inputs', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} />);

      cy.get('#from').type('99-99-9999');
      cy.get('#from').should('have.value', '99-99-9999');
      cy.get('@onChange').should('not.have.been.called');

      cy.get('#from').clear();
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(300);
      cy.get('#from').type('12-12-2023');
      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: null,
      });
      cy.get('#from').should('have.value', '12-12-2023');
    });

    it('should handle endOfDay flag correctly', () => {
      const onChange = cy.stub().as('onChange');
      mount(<Basic onChange={onChange} endOfDay />);

      cy.get('#from').click();
      cy.get('.datepicker.datepicker-dropdown:not(.hidden)').contains('12').click();

      cy.get('@onChange').should('have.been.calledWith', {
        from: Cypress.sinon.match.number,
        to: null,
      });

      cy.get('#from').should(
        'have.value',
        `12-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
      );
    });
  });
});
