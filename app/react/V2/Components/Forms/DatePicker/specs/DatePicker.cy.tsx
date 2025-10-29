import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/DatePicker.stories';

const { Basic } = composeStories(stories);

describe('DatePicker (V2 Forms)', () => {
  it('should be accessible', () => {
    cy.injectAxe();
    mount(<Basic />);
    cy.checkA11y();
  });

  it('should accept and display timestamp values', () => {
    const timestamp = 1698537600000; // Oct 29, 2023 (Sunday)

    mount(<Basic value={timestamp} />);

    // Check if the input has a value (the library should format it)
    cy.get('input[datepicker="true"]').should('not.have.value', '');
  });

  it('should fire onChange callback with timestamp when date is selected', () => {
    const onChange = cy.stub().as('onChange');

    mount(<Basic onChange={onChange} />);

    // Click on input to open datepicker
    cy.get('input[placeholder*="Seleccione una fecha"]').click();

    // Wait for datepicker to be visible and select a date
    cy.get('.datepicker').should('be.visible');
    cy.get('.days')
      .eq(0)
      .within(() => {
        cy.contains('15').click();
      });

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
    mount(<Basic onChange={onChange} value={1698537600000} />);

    cy.get('input[placeholder*="Seleccione una fecha"]').click();
    cy.contains('Limpiar').click();

    // Verify onChange was called (likely with null)
    cy.get('@onChange').should('have.been.called');
  });

  it('should work without dateFormat prop', () => {
    const timestamp = 1698537600000;

    // Mount without dateFormat
    mount(<Basic value={timestamp} dateFormat={undefined} />);

    // Should still display a date
    cy.get('input[datepicker="true"]').should('not.have.value', '');
  });
});
