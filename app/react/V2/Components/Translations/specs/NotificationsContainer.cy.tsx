import React from 'react';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { mount } from '@cypress/react18';
import { NotificationProps } from 'app/stories/Notification';
import { notificationAtom } from 'app/V2/atoms';
import { NotificationsContainer } from '../../UI/NotificationsContainer';

describe('Table', () => {
  const notification: NotificationProps = {
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
  });

  describe('automatic dismissal of notifications', () => {
    it('should dissapear on its own after a time', () => {});

    it('should not dissapear on its own if the user is hovering over the notification', () => {});

    it('should not dissapear on its own if the user clicked the view more button', () => {});
  });
});
