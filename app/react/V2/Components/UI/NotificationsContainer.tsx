import React, { useEffect } from 'react';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';
import { Notification } from 'app/stories/Notification';

const NotificationsContainer = () => {
  const notification = useRecoilValue(notificationAtom);
  const resetState = useResetRecoilState(notificationAtom);

  const notificationIsSet = notification.text && notification.type;

  useEffect(() => {
    if (notificationIsSet) {
      const timer = setTimeout(() => resetState(), 6000);
      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [resetState, notificationIsSet]);

  const onClickHandler = () => {
    resetState();
  };

  return (
    <div className="tw-content">
      {notificationIsSet && (
        <Notification
          type={notification.type}
          text={notification.text}
          details={notification.details}
          heading={notification.heading}
          dismissAction={onClickHandler}
        />
      )}
    </div>
  );
};

export { NotificationsContainer };
