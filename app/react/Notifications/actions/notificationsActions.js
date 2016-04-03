import * as actions from '~/Notifications/actions/actionTypes';
import ID from '~/utils/uniqueID';

export function removeNotification(id) {
  return {
    type: actions.REMOVE_NOTIFICATION,
    id
  };
}

export function notify(message, type) {
  return (dispatch) => {
    let id = ID();
    dispatch({type: actions.NOTIFY, notification: {message, type, id}});

    setTimeout(() => {
      dispatch(removeNotification(id));
    }, 3000);
  };
}
