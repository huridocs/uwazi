import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as requestStatusStories from '#app/stories/RequestStatus.stories.js';
import * as notificationsStories from '#app/stories/NotificationsPanel.stories.js';

const { Playground } = requestStatusStories;
const { Mixed } = notificationsStories;

describe('Notifications stories accessibility', () => {
  it('opens and closes the notifications panel from RequestStatus playground', () => {
    mount(<Playground.Component />);

    cy.get('[data-testid="status-dot"]').click();
    cy.get('#notifications-panel-dialog').should('exist');

    cy.get('body').trigger('keydown', { key: 'Escape' });
    cy.get('#notifications-panel-dialog').should('have.attr', 'aria-hidden', 'true');
  });

  it('has no critical axe violations when panel is open', () => {
    mount(<Mixed.Component />);

    cy.injectAxe();
    cy.get('#notifications-panel-dialog').should('exist');
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
  });

  it('expands notification details and clears completed history', () => {
    mount(<Mixed.Component />);

    cy.contains('button', 'Show details').click();
    cy.contains('ETIMEDOUT').should('exist');

    cy.contains('button', 'Clear all').click();
    cy.contains('Today').should('not.exist');
    cy.contains('Uploading document batch...').should('exist');
  });
});
