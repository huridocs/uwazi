import { actions } from '../../BasicReducer/index.js';
import api from '../../Thesauri/ThesauriAPI.js';

export function reloadThesauri() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
