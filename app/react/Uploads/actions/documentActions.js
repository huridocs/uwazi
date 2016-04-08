import api from '../../utils/singleton_api';
import {notify} from 'app/Notifications';

export function saveDocument(data) {
  return function (dispatch) {
    return api.post('documents', data)
    .then(() => {
      dispatch(notify('saved successfully !', 'info'));
    });
  };
}

export function moveToLibrary(data) {
  return function (dispatch) {
    data.published = true;
    return api.post('documents', data)
    .then(() => {
      dispatch(notify('moved successfully !', 'info'));
    });
  };
}
