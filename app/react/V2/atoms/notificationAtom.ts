import { atom } from 'recoil';
import { NotificationProps } from 'app/stories/Notification';

const notificationAtom = atom({
  key: 'Notification',
  default: {} as NotificationProps,
});

export { notificationAtom };
