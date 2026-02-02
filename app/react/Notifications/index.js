import { notify, removeNotification } from './actions/notificationsActions.js';
import Notifications from './components/Notifications.js';

const notificationActions = {
  notify,
  removeNotification,
};

export { notificationActions };

export default Notifications;
