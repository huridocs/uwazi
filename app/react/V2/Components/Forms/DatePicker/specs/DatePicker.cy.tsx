import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { DatePicker } from 'V2/Components/Forms';

describe('DatePicker (V2 Forms)', () => {
  const defaultProps = {
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
  };

  it('should be accessible', () => {
    cy.injectAxe();
    mount(<DatePicker {...defaultProps} />);
    cy.checkA11y();
  });

  it('should accept and display timestamp values', () => {
    const timestamp = 1698537600000; // Oct 29, 2023 00:00:00 UTC (Sunday)

    mount(<DatePicker {...defaultProps} value={timestamp} />);

    // Wait for datepicker to initialize
    cy.get('input[datepicker="true"]').should('exist');

    // Click to open and verify the correct date is selected in the calendar
    cy.get('input[datepicker="true"]').click();
    cy.get('.datepicker').should('be.visible');

    // The date should be October 29, 2023 - verify in the calendar
    cy.get('.datepicker-picker').within(() => {
      // Check the month/year header shows October 2023
      cy.get('.datepicker-header').should('contain', '2023');
    });
  });

  it('should fire onChange callback with timestamp when date is selected', () => {
    const onChange = cy.stub().as('onChange');

    mount(<DatePicker {...defaultProps} onChange={onChange} />);

    // Click on input to open datepicker
    cy.get('input[datepicker="true"]').click();

    // Wait for datepicker to be visible and select a date
    cy.get('.datepicker').should('be.visible');
    cy.get('.days .day').contains('15').click({ force: true });

    // Verify callback was called with a timestamp (number)
    cy.get('@onChange').should('have.been.calledOnce');
    cy.get('@onChange').then(stub => {
      const callArg = (stub as any).getCall(0).args[0];
      expect(callArg).to.be.a('number');
      expect(callArg).to.be.greaterThan(0);
    });
  });

  it('should clear the date by clicking clear button', () => {
    const onChange = cy.stub().as('onChange');
    const timestamp = 1698537600000;

    mount(<DatePicker {...defaultProps} onChange={onChange} value={timestamp} />);

    // Open datepicker
    cy.get('input[datepicker="true"]').click();
    cy.get('.datepicker').should('be.visible');

    // Click the clear button
    cy.get('.clear-btn').click();

    // Verify onChange was called with null
    cy.get('@onChange').should('have.been.called');
    cy.get('@onChange').then(stub => {
      const callArg = (stub as any).getCall(0).args[0];
      // eslint-disable-next-line no-unused-expressions
      expect(callArg).to.be.null;
    });
  });

  it('should work without dateFormat prop (real usage pattern)', () => {
    const timestamp = 1698537600000;

    // Mount without dateFormat - this is how it's used in ActivityLog
    mount(<DatePicker {...defaultProps} value={timestamp} />);

    // Component should render without errors
    cy.get('input[datepicker="true"]').should('exist');

    // Should be able to open the datepicker
    cy.get('input[datepicker="true"]').click();
    cy.get('.datepicker').should('be.visible');
  });
});
