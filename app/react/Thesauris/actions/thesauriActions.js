import * as types from 'app/Thesauris/actions/actionTypes';
import api from 'app/Thesauris/ThesaurisAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';


export function saveThesauri(thesauri) {
  return function (dispatch) {
    return api.save(thesauri).then(() => {
      dispatch({type: types.THESAURI_SAVED});
      notifications.notify('Thesauri saved', 'info')(dispatch);
    });
  };
}

export function resetThesauri() {
  return {type: types.RESET_THESAURI};
}
