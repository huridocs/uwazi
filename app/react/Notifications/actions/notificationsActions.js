import * as actions from 'app/Notifications/actions/actionTypes';
import ID from 'shared/uniqueID';

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
