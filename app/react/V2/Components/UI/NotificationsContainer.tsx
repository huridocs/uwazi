import React from 'react';
import { useRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';
import { Notification } from 'app/stories/Notification';

const NotificationsContainer = () => {
  const [notification, setNotification] = useRecoilState(notificationAtom);

  return (
    <div className="tw-content">
      {notification.text && notification.type && (
        <Notification
          type={notification.type}
          text={notification.text}
          details={notification.details}
        />
      )}
    </div>
  );
};

export { NotificationsContainer };
