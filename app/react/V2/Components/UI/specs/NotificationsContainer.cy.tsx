import React from 'react';
import { Provider, useSetAtom } from 'jotai';
import { mount } from '@cypress/react18';
import { Provider as ReduxProvider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { notificationAtom, notificationAtomType } from 'V2/atoms';
import { NotificationsContainer } from '../NotificationsContainer';

describe('Notifications container', () => {
  const notification: notificationAtomType = {
    type: 'info',
    text: 'This notifies the user with some information',
    details: 'This are some extra details for this notification',
  };

  const Component = () => {
    const setNotification = useSetAtom(notificationAtom);

    const onClick = () => {
      setNotification(notification);
    };

    return (
      <ReduxProvider store={createStore()}>
        <>
          <NotificationsContainer />
          <button type="button" id="send-notification" onClick={onClick}>
            Send notification
          </button>
        </>
      </ReduxProvider>
    );
  };

  before(() => {
    cy.viewport(500, 500);
  });

  beforeEach(() => {
    mount(
      <Provider>
        <Component />
      </Provider>
    );
  });

  it('Should show the notification on click', () => {
    cy.get('#send-notification').click();
    cy.get('.text-sm').contains(notification.text as string);
  });

  it('should allow users to dismiss the noficication', () => {
    cy.get('#send-notification').click();
    cy.contains('button', 'Dismiss').click();
    cy.get('[data-testid="notifications-container"]').should('not.exist');
  });

  describe('automatic dismissal of notifications', () => {
    it('should disappear on its own after a time', () => {
      cy.clock();
      cy.get('#send-notification').click();
      cy.clock().tick(6000);
      cy.get('[data-testid="notifications-container"]').should('not.exist');
    });

    it('should not disappear on its own if the user is hovering over the notification', () => {
      cy.clock();
      cy.get('#send-notification').click();
      cy.get('[data-testid="notifications-container"]').trigger('mouseover');
      cy.clock().tick(7000);
      cy.get('[data-testid="notifications-container"]').should('exist');

      cy.get('[data-testid="notifications-container"]').trigger('mouseout');
      cy.clock().tick(6000);
      cy.get('[data-testid="notifications-container"]').should('not.exist');
    });
  });
});
