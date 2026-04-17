import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react-webpack5';
import * as requestStatusStories from '#app/stories/RequestStatus.stories.js';
import * as notificationsStories from '#app/stories/NotificationsPanel.stories.js';

const { Playground } = composeStories(requestStatusStories);
const { Mixed } = composeStories(notificationsStories);

describe('Notifications stories accessibility', () => {
  it('opens and closes the notifications panel from RequestStatus playground', () => {
    mount(<Playground />);

    cy.getByTestId('status-dot').click();
    cy.findByRole('dialog', { name: /notifications/i }).should('exist');

    cy.get('body').trigger('keydown', { key: 'Escape' });
    cy.findByRole('dialog', { name: /notifications/i }).should('not.exist');
  });

  it('has no critical axe violations when panel is open', () => {
    mount(<Mixed />);

    cy.injectAxe();
    cy.findByRole('dialog', { name: /notifications/i }).should('exist');
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
  });
});
