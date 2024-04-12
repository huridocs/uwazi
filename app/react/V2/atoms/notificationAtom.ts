import { atom } from 'jotai';
import { NotificationProps } from '../Components/UI/Notification';

type notificationAtomType = Omit<NotificationProps, 'dismissAction'>;

const notificationAtom = atom({} as notificationAtomType);

export type { notificationAtomType };
export { notificationAtom };
