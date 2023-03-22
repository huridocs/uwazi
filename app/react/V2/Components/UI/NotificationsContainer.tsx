import React, { useEffect, useState } from 'react';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';
import { Notification } from 'V2/Components/UI/Notification';

const NotificationsContainer = () => {
  const [timerId, setTimerId] = useState<NodeJS.Timeout>();
  const notification = useRecoilValue(notificationAtom);
  const notificationIsSet = notification.text && notification.type;
  const resetState = useResetRecoilState(notificationAtom);

  useEffect(() => {
    if (notificationIsSet && !timerId) {
      const timer = setTimeout(() => {
        resetState();
      }, 6000);

      setTimerId(timer);
    }

    return () => clearTimeout(timerId);
  }, [resetState, notificationIsSet, timerId]);

  const onClickHandler = () => {
    resetState();
  };

  const handleMouseEnter = () => {
    if (timerId) {
      clearTimeout(timerId);
    }
  };

  const handleMouseLeave = () => {
    if (timerId) {
      clearTimeout(timerId);
    }

    const timer = setTimeout(() => {
      resetState();
    }, 6000);

    setTimerId(timer);
  };

  return (
    <div className="tw-content">
      {notificationIsSet && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed bottom-1 left-2 md:w-2/5 w-4/5 z-10"
        >
          <div className="shadow-lg">
            <Notification
              type={notification.type}
              text={notification.text}
              details={notification.details}
              heading={notification.heading}
              dismissAction={onClickHandler}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { NotificationsContainer };
