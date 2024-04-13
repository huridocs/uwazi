import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { notificationAtom } from 'V2/atoms';
import { Notification } from 'V2/Components/UI/Notification';

const NotificationsContainer = () => {
  const timeout = 6000;
  const [timerId, setTimerId] = useState<NodeJS.Timeout>();
  const notification = useAtomValue(notificationAtom);
  const resetAtom = useResetAtom(notificationAtom);
  const notificationIsSet = Boolean(notification.text && notification.type);

  useEffect(() => {
    if (notificationIsSet && !timerId) {
      const timer = setTimeout(() => {
        resetAtom();
      }, timeout);

      setTimerId(timer);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
        setTimerId(undefined);
      }
    };
  }, [resetAtom, notificationIsSet, timerId]);

  const onClickHandler = () => {
    resetAtom();
  };

  const handleMouseEnter = () => timerId && clearTimeout(timerId);

  const handleMouseLeave = () => {
    if (timerId) clearTimeout(timerId);

    const timer = setTimeout(() => {
      resetAtom();
    }, timeout);

    setTimerId(timer);
  };

  if (!notificationIsSet) {
    return <div />;
  }

  return (
    <div className="tw-content">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed bottom-1 left-2 z-10 w-4/5 md:w-2/5"
      >
        <div className="shadow-lg" role="alert">
          <Notification
            type={notification.type}
            text={notification.text}
            details={notification.details}
            heading={notification.heading}
            dismissAction={onClickHandler}
          />
        </div>
      </div>
    </div>
  );
};

export { NotificationsContainer };
