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

    cy.get('[data-testid="status-dot"]').click();
    cy.get('#notifications-panel-dialog').should('exist');

    cy.get('body').trigger('keydown', { key: 'Escape' });
    cy.get('#notifications-panel-dialog').should('not.exist');
  });

  it('has no critical axe violations when panel is open', () => {
    mount(<Mixed />);

    cy.injectAxe();
    cy.get('#notifications-panel-dialog').should('exist');
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
  });

  it('expands notification details and clears completed history', () => {
    mount(<Mixed />);

    cy.contains('button', 'Show details').click();
    cy.contains('ETIMEDOUT').should('exist');

    cy.contains('button', 'Clear all').click();
    cy.contains('Today').should('not.exist');
    cy.contains('Uploading document batch...').should('exist');
  });
});
