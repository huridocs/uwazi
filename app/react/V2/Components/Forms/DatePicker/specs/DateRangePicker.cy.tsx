import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/DateRangePicker.stories';

const { Basic } = composeStories(stories);

describe('DateRangePicker (V2 Forms)', () => {
  it('should be accessible', () => {
    cy.injectAxe();
    mount(<Basic />);
    cy.checkA11y();
  });

  it('should accept and display timestamp values', () => {
    const fromTimestamp = 1698537600000; // Oct 29, 2023
    const toTimestamp = 1698624000000; // Oct 30, 2023

    mount(<Basic from={fromTimestamp} to={toTimestamp} />);

    // Both inputs should have values
    cy.get('#from').should('not.have.value', '');
    cy.get('#to').should('not.have.value', '');
  });

  it('should fire callbacks with timestamps when dates are selected', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');
    const onToDateSelected = cy.stub().as('onToDateSelected');

    mount(<Basic onFromDateSelected={onFromDateSelected} onToDateSelected={onToDateSelected} />);

    // Click on from input to open datepicker
    cy.get('#from').click();

    // Select a date
    cy.get('.datepicker').should('be.visible');
    cy.get('.days')
      .eq(0)
      .within(() => {
        cy.contains('15').click();
      });

    // Verify callback was called with a timestamp (number)
    cy.get('@onFromDateSelected').should('have.been.calledOnce');
    cy.get('@onFromDateSelected').then(stub => {
      const callArg = (stub as any).getCall(0).args[0];
      expect(callArg).to.be.a('number');
      expect(callArg).to.be.greaterThan(0);
    });
  });

  it('should select today in both inputs', () => {
    const onFromDateSelected = cy.stub().as('onFromDateSelected');
    const onToDateSelected = cy.stub().as('onToDateSelected');

    mount(<Basic onFromDateSelected={onFromDateSelected} onToDateSelected={onToDateSelected} />);

    // Click on from input
    cy.get('#from').click();
    cy.contains('Hoy').click();

    // Both callbacks should be called
    cy.get('@onFromDateSelected').should('have.been.called');
    cy.get('@onToDateSelected').should('have.been.called');
  });

  it('should clear dates using clear buttons', () => {
    const onClear = cy.stub().as('onClear');

    mount(<Basic from={1698537600000} to={1698624000000} onClear={onClear} />);

    // Click clear button on from field
    cy.get('#from').parent().find('button[aria-label="Clear from date"]').click();

    // Verify callback was called
    cy.get('@onClear').should('have.been.calledWith', 'from');
  });

  it('should work without dateFormat prop', () => {
    const fromTimestamp = 1698537600000;
    const toTimestamp = 1698624000000;

    mount(<Basic from={fromTimestamp} to={toTimestamp} dateFormat={undefined} />);

    // Should still display dates
    cy.get('#from').should('not.have.value', '');
    cy.get('#to').should('not.have.value', '');
  });
});
