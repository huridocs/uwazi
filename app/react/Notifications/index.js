import { notify, removeNotification } from '#app/Notifications/actions/notificationsActions.js';
import Notifications from '#app/Notifications/components/Notifications.js';

const notificationActions = {
  notify,
  removeNotification,
};

export { notificationActions };

export default Notifications;
