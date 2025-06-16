import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Notification.stories';

const { Basic, WithHeading, WithDetails } = composeStories(stories);

describe('Notification', () => {
  it('should be accessible', () => {
    cy.injectAxe();

    mount(<Basic />);
    cy.checkA11y();

    mount(<WithHeading />);
    cy.checkA11y();

    mount(<WithDetails />);
    cy.checkA11y();
  });

  it('should render the heading when passed', () => {
    mount(<WithHeading />);
    cy.contains('.text-lg', 'This is the title of the notification').should('exist');

    mount(<Basic />);
    cy.contains('.text-lg', 'This is the title of the notification').should('not.exist');
  });

  it('should not show the button for details when details are not available', () => {
    mount(<Basic />);
    cy.contains('View more').should('not.exist');
  });

  it('should show and hide more information', () => {
    mount(<WithDetails />);
    cy.contains('View more').click();
    cy.contains('.text-sm.mb-4', 'This is some extra information').should('be.visible');

    cy.contains('View less').click();
    cy.contains('.text-sm.mb-4', 'This is some extra information').should('not.exist');
  });
});
