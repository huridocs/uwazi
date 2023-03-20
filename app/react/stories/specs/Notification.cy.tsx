import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import * as stories from '../Notification.stories';

const { Basic, WithHeading, WithDetails } = composeStories(stories);

describe('Notification', () => {
  it('should render the heading when passed', () => {
    mount(<WithHeading />);
    cy.get('.text-lg').should('exist');

    mount(<Basic />);
    cy.get('.text-lg').should('not.exist');
  });

  it('should not show the button for details when details are not available', () => {
    mount(<Basic />);
    cy.get('#details').should('not.exist');
  });

  it('should show and hide more information', () => {
    mount(<WithDetails />);
    cy.contains('View more').click();
    cy.get('.text-sm.mb-4').should('be.visible');

    cy.contains('View less').click();
    cy.get('.text-sm.mb-4').should('not.exist');
  });
});
