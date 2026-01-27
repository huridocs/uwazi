import { atomWithReset } from 'jotai/utils';
import { NotificationProps } from '#V2/Components/UI/Notification.js';

type notificationAtomType = Omit<NotificationProps, 'dismissAction'>;

const notificationAtom = atomWithReset({} as notificationAtomType);

export type { notificationAtomType };
export { notificationAtom };
