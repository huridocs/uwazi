import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import { Provider } from 'react-redux';
import * as stories from 'app/stories/Notification.stories';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const { Basic, WithHeading, WithDetails } = composeStories(stories);

const wrapper = (children: any) => <Provider store={createStore()}>{children}</Provider>;

describe('Notification', () => {
  it('should render the heading when passed', () => {
    mount(wrapper(<WithHeading />));
    cy.contains('.text-lg', 'This is the title of the notification').should('exist');

    mount(wrapper(<Basic />));
    cy.contains('.text-lg', 'This is the title of the notification').should('not.exist');
  });

  it('should not show the button for details when details are not available', () => {
    mount(wrapper(<Basic />));
    cy.contains('View more').should('not.exist');
  });

  it('should show and hide more information', () => {
    mount(wrapper(<WithDetails />));
    cy.contains('View more').click();
    cy.contains('.text-sm.mb-4', 'This is some extra information').should('be.visible');

    cy.contains('View less').click();
    cy.contains('.text-sm.mb-4', 'This is some extra information').should('not.exist');
  });
});
