import { atom } from 'recoil';
import { NotificationProps } from '../Components/UI/Notification';

type notificationAtomType = Omit<NotificationProps, 'dismissAction'>;

const notificationAtom = atom({
  key: 'Notification',
  default: {} as notificationAtomType,
});

export type { notificationAtomType };
export { notificationAtom };
