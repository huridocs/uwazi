import {notify, removeNotification} from '~/Notifications/actions/notificationsActions';
import reducer from '~/Notifications/reducers/notificationsReducer';
import Notifications from '~/Notifications/components/Notifications';

export {reducer, notify, removeNotification};

export default Notifications;
