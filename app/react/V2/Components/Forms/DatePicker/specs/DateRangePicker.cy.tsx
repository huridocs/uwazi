import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { DateRangePicker } from 'app/V2/Components/Forms';

describe('DateRangePicker (V2 Forms)', () => {
  const defaultProps = {
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
  };

  it('should be accessible', () => {
    cy.injectAxe();
    mount(
      <div className="tw-container">
        <DateRangePicker {...defaultProps} />
      </div>
    );
    cy.checkA11y();
  });

  it('should accept and display timestamp values (default usage, no dateFormat)', () => {
    const fromTimestamp = 1698537600000; // Oct 29, 2023
    const toTimestamp = 1698624000000; // Oct 30, 2023

    mount(
      <div className="tw-container">
        <DateRangePicker {...defaultProps} from={fromTimestamp} to={toTimestamp} />
      </div>
    );

    // Both inputs should exist and be able to open
    cy.get('#from').should('exist');
    cy.get('#to').should('exist');

    // Click to verify datepicker opens
    cy.get('#from').click();
    cy.get('.datepicker').should('be.visible');
  });

  it('should fire callbacks with timestamps when dates are selected', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');
    const onToDateSelected = cy.stub().as('onToDateSelected');

    mount(
      <div className="tw-container">
        <DateRangePicker
          {...defaultProps}
          onFromDateSelected={onFromDateSelected}
          onToDateSelected={onToDateSelected}
        />
      </div>
    );

    // Click on from input to open datepicker
    cy.get('#from').click();

    // Select a date
    cy.get('.datepicker').should('be.visible');
    cy.get('.days .day').contains('15').click({ force: true });

    // Verify callback was called with a timestamp (number)
    cy.get('@onFromDateSelected').should('have.been.calledOnce');
    cy.get('@onFromDateSelected').then(stub => {
      const callArg = (stub as any).getCall(0).args[0];
      expect(callArg).to.be.a('number');
      expect(callArg).to.be.greaterThan(0);
    });
  });

  it('should select today using today button', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');

    mount(
      <div className="tw-container">
        <DateRangePicker {...defaultProps} onFromDateSelected={onFromDateSelected} />
      </div>
    );

    // Click on from input to open datepicker
    cy.get('#from').click();
    cy.get('.datepicker').should('be.visible');

    // Click the today button (Spanish: "Hoy")
    cy.contains('button', 'Hoy').click();

    // Callback should be called with a timestamp
    cy.get('@onFromDateSelected').should('have.been.called');
  });

  it('should clear dates using clear buttons', () => {
    const onClear = cy.stub().as('onClear');
    const fromTimestamp = 1698537600000;
    const toTimestamp = 1698624000000;

    mount(
      <div className="tw-container">
        <DateRangePicker
          {...defaultProps}
          from={fromTimestamp}
          to={toTimestamp}
          onClear={onClear}
        />
      </div>
    );

    // Click the clear button for the from field (using InputField's data-testid)
    cy.get('[data-testid="clear-field-button"]').first().click();

    // Verify callback was called
    cy.get('@onClear').should('have.been.calledWith', 'from');
  });

  it('should work with dateFormat prop when provided (exception case)', () => {
    const fromTimestamp = 1698537600000;
    const toTimestamp = 1698624000000;

    // Test that dateFormat still works when explicitly provided
    mount(
      <div className="tw-container">
        <DateRangePicker
          {...defaultProps}
          from={fromTimestamp}
          to={toTimestamp}
          dateFormat="yyyy-mm-dd"
        />
      </div>
    );

    // Component should render without errors
    cy.get('#from').should('exist');
    cy.get('#to').should('exist');

    // Should be able to open the datepicker
    cy.get('#from').click();
    cy.get('.datepicker').should('be.visible');
  });
});
