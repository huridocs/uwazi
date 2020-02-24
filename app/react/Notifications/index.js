import { notify, removeNotification } from './actions/notificationsActions';
import Notifications from './components/Notifications';

const notificationActions = {
  notify,
  removeNotification,
};

export { notificationActions };

export default Notifications;
