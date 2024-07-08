import { atomWithReset } from 'jotai/utils';
import { NotificationProps } from '../Components/UI/Notification';

type notificationAtomType = Omit<NotificationProps, 'dismissAction'>;

const notificationAtom = atomWithReset({} as notificationAtomType);

export type { notificationAtomType };
export { notificationAtom };
