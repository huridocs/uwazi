import React from 'react';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { mount } from '@cypress/react18';
import { notificationAtom, notificationAtomType } from 'app/V2/atoms';
import { NotificationsContainer } from '../../UI/NotificationsContainer';

describe('Notifications container', () => {
  const notification: notificationAtomType = {
    type: 'info',
    text: 'This notifies the user with some information',
    details: 'This are some extra details for this notification',
  };

  const Component = () => {
    const setNotification = useSetRecoilState(notificationAtom);

    const onClick = () => {
      setNotification(notification);
    };

    return (
      <>
        <NotificationsContainer />
        <button type="button" id="send-notification" onClick={onClick}>
          Send notification
        </button>
      </>
    );
  };

  beforeEach(() => {
    mount(
      <RecoilRoot>
        <Component />
      </RecoilRoot>
    );
  });

  it('Should show the notification on click', () => {
    cy.get('#send-notification').click();
    cy.get('.text-sm').contains(notification.text as string);
  });

  it('should allow users to dismiss the noficication', () => {
    cy.get('#send-notification').click();
    cy.get('#dismiss').click();
    cy.get('#notification-container').should('not.exist');
  });

  describe('automatic dismissal of notifications', () => {
    it('should disappear on its own after a time', () => {
      cy.clock();
      cy.get('#send-notification').click();
      cy.clock().tick(6000);
      cy.get('#notification-container').should('not.exist');
    });

    it('should not disappear on its own if the user is hovering over the notification', () => {
      cy.clock();
      cy.get('#send-notification').click();
      cy.get('#notification-container').trigger('mouseover');
      cy.clock().tick(7000);
      cy.get('#notification-container').should('exist');

      cy.get('#notification-container').trigger('mouseout');
      cy.clock().tick(6000);
      cy.get('#notification-container').should('not.exist');
    });
  });
});
